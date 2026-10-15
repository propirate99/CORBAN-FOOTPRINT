import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ObservationPublisher } from '../observationPublisher';
import { ObservationTransport } from '../observationTransport';
import { AggregateObservation, DetectionResult } from '../types';

describe('ObservationPublisher Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('publishes strictly allowlisted aggregate fields (no frames, boxes, or raw data)', async () => {
    let capturedPayload: AggregateObservation | null = null;

    const mockTransport: ObservationTransport = {
      publish: vi.fn().mockImplementation(async (roomId, obs) => {
        capturedPayload = obs;
        return {
          observationId: obs.observationId,
          roomId,
          receivedAt: new Date().toISOString(),
        };
      }),
    };

    const publisher = new ObservationPublisher(
      mockTransport,
      'A-101',
      1000,
      () => {},
      () => {}
    );

    const mockInference: DetectionResult = {
      personCount: 2,
      confidenceScore: 0.88,
      boxes: [{ x: 0.1, y: 0.1, width: 0.3, height: 0.5, score: 0.88 }],
      inferenceTimestampMs: performance.now(),
      wallClockIso: '2026-10-15T06:40:00.000Z',
    };

    publisher.startPublishing(() => mockInference);

    // Advance timer to trigger publish tick
    await vi.advanceTimersByTimeAsync(1100);

    expect(capturedPayload).not.toBeNull();
    const payloadKeys = Object.keys(capturedPayload!);
    expect(payloadKeys.sort()).toEqual([
      'cameraSessionId',
      'coverage',
      'observationId',
      'observedAt',
      'peopleDetected',
      'source',
    ]);

    expect((capturedPayload as any).boxes).toBeUndefined();
    expect((capturedPayload as any).confidenceScore).toBeUndefined();
    expect((capturedPayload as any).image).toBeUndefined();
    expect((capturedPayload as any).frame).toBeUndefined();

    publisher.stopPublishing();
  });

  it('does not publish stale inferences (>5s old)', async () => {
    const publishFn = vi.fn();
    const mockTransport: ObservationTransport = {
      publish: publishFn,
    };

    const publisher = new ObservationPublisher(
      mockTransport,
      'A-101',
      1000,
      () => {},
      () => {}
    );

    // Inference from 10 seconds ago
    const staleInference: DetectionResult = {
      personCount: 3,
      confidenceScore: 0.95,
      boxes: [],
      inferenceTimestampMs: performance.now() - 10000,
      wallClockIso: new Date().toISOString(),
    };

    publisher.startPublishing(() => staleInference);
    await vi.advanceTimersByTimeAsync(1100);

    expect(publishFn).not.toHaveBeenCalled();
    publisher.stopPublishing();
  });

  it('prevents overlapping / concurrent requests in flight', async () => {
    let inFlightCount = 0;
    let maxInFlightCount = 0;

    const mockTransport: ObservationTransport = {
      publish: vi.fn().mockImplementation(async () => {
        inFlightCount++;
        maxInFlightCount = Math.max(maxInFlightCount, inFlightCount);
        // Delay resolution by 2000ms
        await new Promise((r) => setTimeout(r, 2000));
        inFlightCount--;
        return {
          observationId: 'ack-1',
          roomId: 'A-101',
          receivedAt: new Date().toISOString(),
        };
      }),
    };

    const publisher = new ObservationPublisher(
      mockTransport,
      'A-101',
      500, // fast tick
      () => {},
      () => {}
    );

    let tick = 0;
    publisher.startPublishing(() => {
      tick++;
      return {
        personCount: 1,
        confidenceScore: 0.9,
        boxes: [],
        inferenceTimestampMs: performance.now() + tick,
        wallClockIso: new Date().toISOString(),
      };
    });

    // Advance by 3500ms
    await vi.advanceTimersByTimeAsync(3500);

    // Enforce that max concurrent requests was never > 1
    expect(maxInFlightCount).toBe(1);
    publisher.stopPublishing();
  });

  it('does not publish duplicate inferences for the same frame timestamp', async () => {
    const publishFn = vi.fn().mockResolvedValue({
      observationId: 'ack-1',
      roomId: 'A-101',
      receivedAt: new Date().toISOString(),
    });

    const mockTransport: ObservationTransport = {
      publish: publishFn,
    };

    const publisher = new ObservationPublisher(
      mockTransport,
      'A-101',
      500,
      () => {},
      () => {}
    );

    const staticInference: DetectionResult = {
      personCount: 2,
      confidenceScore: 0.85,
      boxes: [],
      inferenceTimestampMs: performance.now(),
      wallClockIso: '2026-10-15T06:40:00.000Z',
    };

    publisher.startPublishing(() => staticInference);

    // Advance multiple intervals
    await vi.advanceTimersByTimeAsync(2000);

    // Published only once despite multiple ticks
    expect(publishFn).toHaveBeenCalledTimes(1);
    publisher.stopPublishing();
  });
});
