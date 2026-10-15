export interface DetectionResult {
  personCount: number;
  confidenceScore: number;
  boxes?: Array<{ x: number; y: number; width: number; height: number; score: number }>;
}

export class EdgeDetector {
  private isModelLoaded = false;

  async loadModel(): Promise<boolean> {
    // Simulated lightweight client-side TFLite/WASM model loader
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }

  get isLoaded(): boolean {
    return this.isModelLoaded;
  }

  detectFrame(videoElement: HTMLVideoElement | null): DetectionResult {
    if (!videoElement) {
      return { personCount: 0, confidenceScore: 0 };
    }

    // In a live environment, this runs tf.tidy with the loaded TFLite model.
    // For local deterministic prototyping, we provide realistic heuristic bounding boxes.
    const isMock = true;
    if (isMock) {
      return {
        personCount: 1,
        confidenceScore: 0.94,
        boxes: [
          { x: 0.25, y: 0.2, width: 0.5, height: 0.65, score: 0.94 },
        ],
      };
    }

    return { personCount: 0, confidenceScore: 0.9 };
  }
}
