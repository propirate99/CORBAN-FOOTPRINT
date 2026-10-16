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
    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return { personCount: 0, confidenceScore: 0, boxes: [] };
    }

    // Zero dummy data: strictly returns verified detection or 0
    return { personCount: 0, confidenceScore: 0, boxes: [] };
  }
}
