import { request } from './client';
import { ScenarioInput, ScenarioResult } from '../types/api';

export async function simulateScenario(payload: ScenarioInput): Promise<ScenarioResult> {
  return request<ScenarioResult>('/simulation/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
