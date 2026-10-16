import { request } from './client';
import { ObservationInput, ObservationReceipt } from '../types/api';

export async function submitObservation(payload: ObservationInput): Promise<ObservationReceipt> {
  return request<ObservationReceipt>('/observations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
