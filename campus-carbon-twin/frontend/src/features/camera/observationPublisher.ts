import { submitObservation } from '../../api/observations';

export class ObservationPublisher {
  private roomId: string;
  private sessionId: string;
  private intervalId: any = null;
  private onSyncCallback?: (ts: string) => void;

  constructor(roomId: string, onSync?: (ts: string) => void) {
    this.roomId = roomId;
    this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 10);
    this.onSyncCallback = onSync;
  }

  startPublishing(getCount: () => { count: number; confidence: number }, intervalMs = 5000) {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      const { count, confidence } = getCount();
      const nowIso = new Date().toISOString();
      try {
        await submitObservation({
          roomId: this.roomId,
          personCount: count,
          confidenceScore: confidence,
          timestamp: nowIso,
          sessionId: this.sessionId,
          observedAt: nowIso,
        });
        if (this.onSyncCallback) {
          this.onSyncCallback(nowIso);
        }
      } catch (err: any) {
        console.warn('Edge observation publish error:', err?.message || 'Publish failed');
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
