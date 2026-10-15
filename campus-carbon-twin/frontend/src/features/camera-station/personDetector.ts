import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';
import { CAMERA_CONFIG } from './config';
import { DetectedBox, DetectionResult, DetectorState } from './types';

export class PersonDetector {
  private detector: ObjectDetector | null = null;
  private lastProcessedTime: number = -1;
  private lastInferenceTimestampMs: number = -1;
  private scoreThreshold: number = CAMERA_CONFIG.defaultConfidenceThreshold;
  private onStateChange: (state: DetectorState, error?: string) => void;

  constructor(onStateChange: (state: DetectorState, error?: string) => void) {
    this.onStateChange = onStateChange;
  }

  setThreshold(threshold: number) {
    this.scoreThreshold = threshold;
  }

  async initialize(): Promise<boolean> {
    this.onStateChange('LOADING');
    try {
      const base = import.meta.env.BASE_URL || '/';
      const cleanBase = base.endsWith('/') ? base : `${base}/`;
      const wasmPath = `${cleanBase}${CAMERA_CONFIG.wasmRelativePath}`;
      const modelPath = `${cleanBase}${CAMERA_CONFIG.modelRelativePath}`;

      const vision = await FilesetResolver.forVisionTasks(wasmPath);

      this.detector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: 'CPU', // Universal compatibility
        },
        runningMode: 'VIDEO',
        categoryAllowlist: ['person'],
        scoreThreshold: this.scoreThreshold,
      });

      this.onStateChange('READY');
      return true;
    } catch (err: any) {
      console.error('Failed to load MediaPipe Person Detector:', err);
      this.onStateChange('ERROR', `Model loading failed: ${err.message || 'Unknown error'}`);
      return false;
    }
  }

  detectFrame(videoElement: HTMLVideoElement): DetectionResult | null {
    if (!this.detector) {
      return null;
    }

    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return null;
    }

    // Do not process duplicate video frames
    if (videoElement.currentTime === this.lastProcessedTime) {
      return null;
    }
    this.lastProcessedTime = videoElement.currentTime;

    // Use strictly increasing inference timestamps (monotonic)
    let now = performance.now();
    if (now <= this.lastInferenceTimestampMs) {
      now = this.lastInferenceTimestampMs + 1;
    }
    this.lastInferenceTimestampMs = now;

    try {
      const result = this.detector.detectForVideo(videoElement, now);

      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;

      const boxes: DetectedBox[] = [];
      let totalConfidence = 0;

      for (const detection of result.detections) {
        // Filter strictly for category "person" meeting threshold
        const personCategory = detection.categories.find(
          (c) => c.categoryName.toLowerCase() === 'person' && c.score >= this.scoreThreshold
        );

        if (personCategory && detection.boundingBox) {
          totalConfidence += personCategory.score;
          const bb = detection.boundingBox;

          // Normalize to [0.0 - 1.0] relative to video dimensions
          boxes.push({
            x: bb.originX / videoWidth,
            y: bb.originY / videoHeight,
            width: bb.width / videoWidth,
            height: bb.height / videoHeight,
            score: personCategory.score,
          });
        }
      }

      const personCount = boxes.length;
      const avgConfidence = personCount > 0 ? totalConfidence / personCount : 0.9;

      return {
        personCount,
        confidenceScore: avgConfidence,
        boxes,
        inferenceTimestampMs: now,
        wallClockIso: new Date().toISOString(),
      };
    } catch (inferenceErr: any) {
      console.warn('MediaPipe inference error:', inferenceErr);
      return null;
    }
  }

  reset() {
    this.lastProcessedTime = -1;
    this.lastInferenceTimestampMs = -1;
  }

  dispose() {
    if (this.detector) {
      try {
        this.detector.close();
      } catch (e) {
        // ignore
      }
      this.detector = null;
    }
    this.onStateChange('NOT_LOADED');
  }
}
