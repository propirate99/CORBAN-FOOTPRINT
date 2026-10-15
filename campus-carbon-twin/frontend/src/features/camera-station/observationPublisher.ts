import { ObservationTransport } from './observationTransport';
import { AggregateObservation, DetectionResult, ObservationAck, PublisherState } from './types';
import { CAMERA_CONFIG } from './config';

export class ObservationPublisher {
  private transport: ObservationTransport;
  private currentRoomId: string;
  private cameraSessionId: string;
  private publishIntervalMs: number;
  private timerId: any = null;
  private activeAbortController: AbortController | null = null;
  private isRequestInFlight = false;
  private lastPublishedInferenceTimestamp = -1;
  private onStateChange: (state: PublisherState, error?: string) => void;
  private onAckReceived: (ack: ObservationAck) => void;

  constructor(
    transport: ObservationTransport,
    roomId: string,
    publishIntervalMs: number = CAMERA_CONFIG.defaultPublishIntervalMs,
    onStateChange: (state: PublisherState, error?: string) => void,
    onAckReceived: (ack: ObservationAck) => void
  ) {
    this.transport = transport;
    this.currentRoomId = roomId;
    this.cameraSessionId = crypto.randomUUID();
    this.publishIntervalMs = publishIntervalMs;
    this.onStateChange = onStateChange;
    this.onAckReceived = onAckReceived;
  }

  setRoomId(newRoomId: string) {
    if (this.currentRoomId !== newRoomId) {
      this.currentRoomId = newRoomId;
      this.cameraSessionId = crypto.randomUUID(); // New session for new room assignment
      this.lastPublishedInferenceTimestamp = -1;
      this.abortInFlight();
    }
  }

  setInterval(intervalMs: number) {
    this.publishIntervalMs = intervalMs;
  }

  startPublishing(getLatestInference: () => DetectionResult | null) {
    this.stopPublishing();
    this.onStateChange('IDLE');

    this.timerId = setInterval(async () => {
      // Rule: At most one request in flight
      if (this.isRequestInFlight) {
        return;
      }

      const inference = getLatestInference();
      if (!inference) {
        return;
      }

      // Rule: Check freshness (no stale data)
      const now = performance.now();
      const ageMs = now - inference.inferenceTimestampMs;
      if (ageMs > CAMERA_CONFIG.inferenceFreshnessLimitMs) {
        return; // Inference too old, wait for fresh detection
      }

      // Rule: Each inference can be published at most once
      if (inference.inferenceTimestampMs <= this.lastPublishedInferenceTimestamp) {
        return; // Already published this frame's result
      }

      this.isRequestInFlight = true;
      this.onStateChange('SENDING');

      this.activeAbortController = new AbortController();

      const observation: AggregateObservation = {
        observationId: crypto.randomUUID(),
        cameraSessionId: this.cameraSessionId,
        peopleDetected: inference.personCount,
        observedAt: inference.wallClockIso, // Wall clock of inference, not fabricated at publish time
        coverage: 'DEMO_AREA',
        source: 'BROWSER_CAMERA',
      };

      try {
        const ack = await this.transport.publish(
          this.currentRoomId,
          observation,
          this.activeAbortController.signal
        );

        this.lastPublishedInferenceTimestamp = inference.inferenceTimestampMs;
        this.onStateChange('CONNECTED');
        this.onAckReceived(ack);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Publishing failed:', err.message);
          this.onStateChange('ERROR', err.message || 'Publishing failed');
        }
      } finally {
        this.isRequestInFlight = false;
        this.activeAbortController = null;
      }
    }, this.publishIntervalMs);
  }

  stopPublishing() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.abortInFlight();
    this.onStateChange('UNCONNECTED');
  }

  private abortInFlight() {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
    this.isRequestInFlight = false;
  }
}
