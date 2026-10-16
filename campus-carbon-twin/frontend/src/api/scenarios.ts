import { request } from './client';
import {
  ScenarioInput,
  ScenarioResult,
  SavedScenario,
  ExplanationResponse,
  ScenarioComparisonResponse,
} from '../types/api';

export async function simulateScenario(payload: ScenarioInput): Promise<ScenarioResult> {
  return request<ScenarioResult>('/simulation/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch all saved digital twin scenarios.
 */
export async function fetchScenarios(): Promise<SavedScenario[]> {
  return request<SavedScenario[]>('/scenarios');
}

/**
 * Fetch a single saved scenario by ID.
 */
export async function fetchScenarioDetail(scenarioId: string): Promise<SavedScenario> {
  return request<SavedScenario>(`/scenarios/${scenarioId}`);
}

/**
 * Request grounded explanation for a scenario.
 * The browser sends only scenarioId to prevent fabricated inputs.
 */
export async function explainScenario(scenarioId: string): Promise<ExplanationResponse> {
  return request<ExplanationResponse>(`/scenarios/${scenarioId}/explanation`, {
    method: 'POST',
  });
}

/**
 * Compare two calculated alternative scenarios.
 */
export async function compareScenarios(
  scenarioId: string,
  alternativeId: string = 'scenario-124'
): Promise<ScenarioComparisonResponse> {
  return request<ScenarioComparisonResponse>(
    `/scenarios/${scenarioId}/compare?alternativeId=${encodeURIComponent(alternativeId)}`,
    {
      method: 'POST',
    }
  );
}

/**
 * Demonstration helper: override occupancy to test safety/eligibility live.
 */
export async function overrideRoomOccupancy(
  scenarioId: string,
  occupancy: number,
  stale: boolean = false
): Promise<{ scenarioId: string; roomId: string; newOccupancy: number; isStale: boolean }> {
  return request<{ scenarioId: string; roomId: string; newOccupancy: number; isStale: boolean }>(
    `/scenarios/${scenarioId}/occupancy-override`,
    {
      method: 'POST',
      body: JSON.stringify({ occupancy, stale }),
    }
  );
}

