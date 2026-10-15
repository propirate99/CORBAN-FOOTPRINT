import { AggregateObservation, ObservationAck } from './types';

export interface ObservationTransport {
  publish(
    roomId: string,
    observation: AggregateObservation,
    signal?: AbortSignal
  ): Promise<ObservationAck>;
}

export class HttpObservationTransport implements ObservationTransport {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Respects VITE_API_URL or defaults to relative /api/v1 for production reverse proxy
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || '/api/v1';
  }

  async publish(
    roomId: string,
    observation: AggregateObservation,
    signal?: AbortSignal
  ): Promise<ObservationAck> {
    const primaryUrl = `${this.baseUrl}/rooms/${encodeURIComponent(roomId)}/observations`;
    const fallbackUrl = `${this.baseUrl}/observations`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Strict validation: do not send images, frames, or non-allowlisted fields
    const payload: AggregateObservation = {
      observationId: observation.observationId,
      cameraSessionId: observation.cameraSessionId,
      peopleDetected: observation.peopleDetected,
      observedAt: observation.observedAt,
      coverage: 'DEMO_AREA',
      source: 'BROWSER_CAMERA',
    };

    let response: Response;
    try {
      response = await fetch(primaryUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal,
      });

      // If room-specific subpath returns 404, fallback to generic /observations
      if (response.status === 404) {
        response = await fetch(fallbackUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...payload, roomId }),
          signal,
        });
      }
    } catch (networkError: any) {
      if (networkError.name === 'AbortError') {
        throw networkError;
      }
      throw new Error(`Transport network error: ${networkError.message || 'Failed to connect to backend'}`);
    }

    if (!response.ok) {
      throw new Error(`Backend rejected observation with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      observationId: data.observationId || data.id || observation.observationId,
      roomId: data.roomId || roomId,
      receivedAt: data.receivedAt || data.loggedAt || new Date().toISOString(),
    };
  }
}
