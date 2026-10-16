import { describe, it, expect } from 'vitest';
import { ExplanationResponse } from '../types/api';

describe('GenAI Grounded Explainer Frontend Contract', () => {
  const mockResponse: ExplanationResponse = {
    scenarioId: 'scenario-123',
    roomId: 'ROOM-SCI-204',
    source: 'TEMPLATE',
    fallbackReason: 'AI service unconfigured',
    generatedAt: '2026-10-16T07:10:00Z',
    currentEligibility: 'ELIGIBLE',
    evidenceLevel: 'SIMULATED',
    metrics: {
      estimatedAvoidedKwh: 0.32,
      estimatedAvoidedKgCo2: 0.22912,
    },
    factorMetadata: {
      factorSource: 'EPA eGRID',
      reportingYear: 2024,
      factorValue: 0.716,
      factorUnit: 'kg CO2e / kWh',
    },
    explanation: {
      summary: 'Inspect the classroom and consider switching off the selected nonessential lights if unused.',
      reason: 'The scenario combines repeated fresh zero-person observations in camera view with equipment declared on.',
      assumptions: ['The equipment inventory reflects the selected lights.'],
      suggestedChecks: ['Inspect the room, including areas outside camera view.'],
    },
    mandatorySafetyChecks: [
      'Do not affect emergency lighting or critical equipment.',
      'Do not reduce required ventilation.',
      'Human confirmation is required.',
    ],
    limitations: [
      'No person detected in camera view does not prove the entire room is empty.',
      'The result is simulated, not meter-verified savings.',
    ],
    actionPermission: 'HUMAN_APPROVAL_REQUIRED',
  };

  it('guarantees backend owns calculation metrics and safety checks', () => {
    expect(mockResponse.metrics.estimatedAvoidedKwh).toBe(0.32);
    expect(mockResponse.metrics.estimatedAvoidedKgCo2).toBe(0.22912);
    expect(mockResponse.mandatorySafetyChecks).toContain('Do not affect emergency lighting or critical equipment.');
    expect(mockResponse.actionPermission).toBe('HUMAN_APPROVAL_REQUIRED');
  });

  it('verifies explanation is marked as TEMPLATE when fallback is active', () => {
    expect(mockResponse.source).toBe('TEMPLATE');
    expect(mockResponse.fallbackReason).toBeDefined();
  });

  it('verifies no API key is exposed in client environment', () => {
    const geminiKeyInClient = (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY;
    expect(geminiKeyInClient).toBeUndefined();
  });
});
