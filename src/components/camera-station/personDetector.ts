import { FilesetResolver, ObjectDetector, FaceDetector } from '@mediapipe/tasks-vision';
import { CAMERA_CONFIG } from './config';
import { DetectedBox, DetectionResult, DetectorState } from './types';

export class PersonDetector {
  private detector: ObjectDetector | null = null;
  private faceDetector: FaceDetector | null = null;
  private lastProcessedTime: number = -1;
  private lastInferenceTimestampMs: number = -1;
  private scoreThreshold: number = CAMERA_CONFIG.defaultConfidenceThreshold;
  private onStateChange: (state: DetectorState, error?: string) => void;

  constructor(onStateChange: (state: DetectorState, error?: string) => void) {
    this.onStateChange = onStateChange;
  }

  setThreshold(threshold: number) {
    this.scoreThreshold = threshold;
    if (this.detector) {
      try {
        this.detector.setOptions({ scoreThreshold: Math.min(0.2, threshold) });
      } catch (e) {}
    }
  }

  async initialize(): Promise<boolean> {
    this.onStateChange('LOADING');
    try {
      const base = import.meta.env.BASE_URL || '/';
      const cleanBase = base.endsWith('/') ? base : `${base}/`;
      const wasmPath = `${cleanBase}${CAMERA_CONFIG.wasmRelativePath}`;
      const modelPath = `${cleanBase}${CAMERA_CONFIG.modelRelativePath}`;
      const faceModelPath = `${cleanBase}camera-assets/models/blaze_face_short_range.tflite`;

      const vision = await FilesetResolver.forVisionTasks(wasmPath);

      // 1. Primary Full/Upper Body Object Detector
      this.detector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: 'CPU', // Universal compatibility
        },
        runningMode: 'VIDEO',
        categoryAllowlist: ['person'],
        scoreThreshold: Math.min(0.25, this.scoreThreshold),
      });

      // 2. High-precision Occlusion Face/Head Detector (Detects persons behind others or partially hidden)
      try {
        this.faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: faceModelPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.35,
        });
      } catch (faceErr) {
        console.warn('MediaPipe FaceDetector fallback active (using ObjectDetector only):', faceErr);
      }

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

      // 1. Extract Person Body Detections
      // Use dynamic sensitivity: allow detections down to user threshold or 0.35 for occluded bodies
      const effectiveThreshold = Math.min(this.scoreThreshold, 0.45);

      for (const detection of result.detections) {
        const personCategory = detection.categories.find(
          (c) => c.categoryName.toLowerCase() === 'person' && c.score >= effectiveThreshold
        );

        if (personCategory && detection.boundingBox) {
          totalConfidence += personCategory.score;
          const bb = detection.boundingBox;

          boxes.push({
            x: Math.max(0, bb.originX / videoWidth),
            y: Math.max(0, bb.originY / videoHeight),
            width: Math.min(1, bb.width / videoWidth),
            height: Math.min(1, bb.height / videoHeight),
            score: personCategory.score,
          });
        }
      }

      // 2. Run Occlusion & Person-Behind-Person Detection via Face Detector
      if (this.faceDetector) {
        try {
          const faceResult = this.faceDetector.detectForVideo(videoElement, now);
          if (faceResult && faceResult.detections && faceResult.detections.length > 0) {
            interface ValidFace {
              fx: number;
              fy: number;
              fw: number;
              fh: number;
              fcx: number;
              fcy: number;
              score: number;
            }
            const validFaces: ValidFace[] = [];
            for (const face of faceResult.detections) {
              const faceScore = face.categories?.[0]?.score ?? 0.8;
              if (faceScore < 0.28 || !face.boundingBox) continue;
              const fb = face.boundingBox;
              const fx = fb.originX / videoWidth;
              const fy = fb.originY / videoHeight;
              const fw = fb.width / videoWidth;
              const fh = fb.height / videoHeight;
              validFaces.push({
                fx, fy, fw, fh,
                fcx: fx + fw / 2,
                fcy: fy + fh / 2,
                score: faceScore,
              });
            }

            // For each existing person box, find the best matching face (closest to expected head location)
            const faceClaimedByBox = new Map<number, number>();
            const boxClaimedFace = new Map<number, number>();

            const pairs: { boxIdx: number; faceIdx: number; dist: number }[] = [];
            for (let bIdx = 0; bIdx < boxes.length; bIdx++) {
              const b = boxes[bIdx];
              const hx = b.x + b.width / 2;
              const hy = b.y + Math.min(b.height * 0.2, 0.12);

              for (let fIdx = 0; fIdx < validFaces.length; fIdx++) {
                const f = validFaces[fIdx];
                const xOverlap = f.fcx >= b.x - b.width * 0.3 && f.fcx <= b.x + b.width * 1.3;
                const yOverlap = f.fcy >= b.y - 0.08 && f.fcy <= b.y + b.height * 0.55;

                if (xOverlap && yOverlap) {
                  const dist = Math.hypot((f.fcx - hx) / (b.width || 0.1), (f.fcy - hy) / (b.height * 0.4 || 0.1));
                  pairs.push({ boxIdx: bIdx, faceIdx: fIdx, dist });
                }
              }
            }

            // Sort pairs by ascending distance and greedily assign 1-to-1
            pairs.sort((a, b) => a.dist - b.dist);
            for (const pair of pairs) {
              if (!boxClaimedFace.has(pair.boxIdx) && !faceClaimedByBox.has(pair.faceIdx)) {
                boxClaimedFace.set(pair.boxIdx, pair.faceIdx);
                faceClaimedByBox.set(pair.faceIdx, pair.boxIdx);
              }
            }

            // Any face NOT claimed by an existing person box represents an occluded person
            // (e.g., standing behind another person, sitting behind monitors or desks)
            for (let fIdx = 0; fIdx < validFaces.length; fIdx++) {
              if (!faceClaimedByBox.has(fIdx)) {
                const f = validFaces[fIdx];
                const personW = Math.min(0.85, Math.max(f.fw * 2.4, 0.16));
                const personH = Math.min(0.85, Math.max(f.fh * 3.2, 0.28));
                const personX = Math.max(0, f.fcx - personW / 2);
                const personY = Math.max(0, f.fy - f.fh * 0.25);

                boxes.push({
                  x: personX,
                  y: personY,
                  width: Math.min(1 - personX, personW),
                  height: Math.min(1 - personY, personH),
                  score: Math.max(0.75, f.score),
                });
                totalConfidence += Math.max(0.75, f.score);
              }
            }
          }
        } catch (faceErr) {
          // Ignore frame-level face detection errors
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
      } catch (e) {}
      this.detector = null;
    }
    if (this.faceDetector) {
      try {
        this.faceDetector.close();
      } catch (e) {}
      this.faceDetector = null;
    }
    this.onStateChange('NOT_LOADED');
  }
}
