import { submitObservation } from '../../api/observations';

export class ObservationPublisher {
  private roomId: string;
  private intervalId: any = null;
  private onSyncCallback?: (ts: string) => void;

  constructor(roomId: string, onSync?: (ts: string) => void) {
    this.roomId = roomId;
    this.onSyncCallback = onSync;
  }

  startPublishing(getCount: () => { count: number; confidence: number }, intervalMs = 5000) {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      const { count, confidence } = getCount();
      try {
        await submitObservation({
          roomId: this.roomId,
          personCount: count,
          confidenceScore: confidence,
          timestamp: new Date().toISOString(),
        });
        if (this.onSyncCallback) {
          this.onSyncCallback(new Date().toISOString());
        }
      } catch (err) {
        console.warn('Edge observation publish fallback:', err);
      }
    }, intervalMs);
  }

  stopPublishing() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
