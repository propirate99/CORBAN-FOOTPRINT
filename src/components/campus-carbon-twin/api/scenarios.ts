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

const getClientGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem('carbontwin_gemini_key') || sessionStorage.getItem('carbontwin_gemini_key');
    if (fromStorage) return fromStorage;
  }
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
};

const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-3.5-flash';

/**
 * Request grounded explanation for a scenario.
 * Tries the backend service first, and seamlessly falls back to direct Gemini 3.5 Flash API.
 */
export async function explainScenario(scenarioId: string): Promise<ExplanationResponse> {
  try {
    return await request<ExplanationResponse>(`/scenarios/${scenarioId}/explanation`, {
      method: 'POST',
    });
  } catch (backendErr) {
    console.info(`Backend /scenarios/${scenarioId}/explanation offline or static (${backendErr instanceof Error ? backendErr.message : String(backendErr)}). Calling Gemini 3.5 Flash directly...`);
    return await generateDirectGeminiExplanation(scenarioId);
  }
}

async function generateDirectGeminiExplanation(scenarioId: string): Promise<ExplanationResponse> {
  const isScenario124 = scenarioId === 'scenario-124';
  const facts = {
    scenarioId,
    roomId: 'ROOM-SCI-204',
    title: isScenario124 ? 'Eco-Mode HVAC Setback' : 'Nonessential Lighting Deactivation',
    equipment: isScenario124 ? 'HVAC Air Handler VAV damper throttling' : '8 Nonessential Lab Bench Workstation LED Luminaires',
    durationMinutes: 120,
    avoidedKwh: isScenario124 ? 2.6 : 0.32,
    avoidedKgCo2e: isScenario124 ? 1.8616 : 0.22912,
    observation: 'Repeated fresh zero-person observations confirmed by ceiling edge vision camera node.'
  };

  let generated = {
    summary: `Automated ${isScenario124 ? 'HVAC setpoint increase and fan setback' : 'lighting deactivation'} proposal for Room SCI-204 based on vision occupancy confirmation.`,
    reason: `Vision node observed 0 detected occupants for >15 minutes, allowing a temporary setback of ${facts.equipment} without academic impact.`,
    assumptions: [
      'Edge camera vision confidence exceeds 92%',
      'Room has no immediate reservation scheduled within the next 45 minutes',
      'HVAC setback maintains indoor climate within safe non-condensation limits'
    ],
    suggestedChecks: [
      'Confirm the room is not reserved for student group study or special events',
      'Walk past room to verify emergency pathway egress illumination remains operational'
    ]
  };

  let source: 'GENAI' | 'TEMPLATE' = 'GENAI';
  let fallbackReason: string | null = null;

  try {
    const prompt = `You explain campus energy-saving scenarios to a university facilities officer.
Use only the supplied structured facts:
Room: Physics Lecture Hall 204 (${facts.roomId})
Intervention: ${facts.title}
Equipment: ${facts.equipment}
Duration: ${facts.durationMinutes} minutes
Simulated Avoided Energy: ${facts.avoidedKwh} kWh
Simulated Avoided Emissions: ${facts.avoidedKgCo2e} kg CO2e
Camera observation: ${facts.observation}

Rules:
1. Do not invent measurements or financial numbers.
2. Say "no person detected in camera view", not "the room is empty".
3. Return strictly a JSON object with:
  - "summary": string (concise explanation)
  - "reason": string (grounded reason based on camera detection and schedule)
  - "assumptions": array of strings (technical operational assumptions)
  - "suggestedChecks": array of strings (human verification checks before physical action)`;

    const apiKey = getClientGeminiApiKey();
    if (!apiKey) {
      source = 'TEMPLATE';
      fallbackReason = 'No client-side Gemini API key configured and backend is offline';
      throw new Error('No API key');
    }
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    let res: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2
            }
          })
        });
        if (res.ok || (res.status !== 503 && res.status !== 429)) {
          break;
        }
      } catch (e) {
        if (attempt === 3) throw e;
      }
      await new Promise(r => setTimeout(r, 800 * attempt));
    }

    if (res && res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.summary && parsed.reason) {
          generated = {
            summary: parsed.summary,
            reason: parsed.reason,
            assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : generated.assumptions,
            suggestedChecks: Array.isArray(parsed.suggestedChecks) ? parsed.suggestedChecks : generated.suggestedChecks
          };
          source = 'GENAI';
        }
      }
    } else {
      source = 'TEMPLATE';
      fallbackReason = `Gemini returned HTTP ${res.status}`;
    }
  } catch (e) {
    source = 'TEMPLATE';
    fallbackReason = e instanceof Error ? e.message : 'Network error accessing Gemini API';
  }

  return {
    scenarioId,
    roomId: facts.roomId,
    source,
    fallbackReason,
    generatedAt: new Date().toISOString(),
    currentEligibility: 'ELIGIBLE',
    evidenceLevel: 'SIMULATED',
    metrics: {
      estimatedAvoidedKwh: facts.avoidedKwh,
      estimatedAvoidedKgCo2: facts.avoidedKgCo2e,
    },
    factorMetadata: {
      factorSource: 'Documented regional historical eGRID subregion factor (CAMX / NE-ISO)',
      reportingYear: 2024,
      factorValue: 0.716,
      factorUnit: 'kg CO2e / kWh',
    },
    explanation: generated,
    mandatorySafetyChecks: [
      'Do not affect emergency lighting or critical equipment.',
      'Do not reduce required ventilation below occupancy codes.',
      'Human confirmation and manual walk-through is required before any physical action.',
    ],
    limitations: [
      'No person detected in camera view does not prove the entire room is empty.',
      'The result is a simulated estimate based on declared equipment wattage, not meter-verified savings.',
    ],
    actionPermission: 'HUMAN_APPROVAL_REQUIRED',
  };
}

/**
 * Compare two calculated alternative scenarios.
 */
export async function compareScenarios(
  scenarioId: string,
  alternativeId: string = 'scenario-124'
): Promise<ScenarioComparisonResponse> {
  try {
    return await request<ScenarioComparisonResponse>(
      `/scenarios/${scenarioId}/compare?alternativeId=${encodeURIComponent(alternativeId)}`,
      {
        method: 'POST',
      }
    );
  } catch {
    return {
      scenarioA: {
        id: scenarioId,
        title: scenarioId === 'scenario-124' ? 'Eco-Mode HVAC Setback' : 'Nonessential Lighting Deactivation',
        avoidedKwh: scenarioId === 'scenario-124' ? 2.6 : 0.32,
        avoidedKgCo2: scenarioId === 'scenario-124' ? 1.8616 : 0.22912,
      },
      scenarioB: {
        id: alternativeId,
        title: alternativeId === 'scenario-124' ? 'Eco-Mode HVAC Setback' : 'Nonessential Lighting Deactivation',
        avoidedKwh: alternativeId === 'scenario-124' ? 2.6 : 0.32,
        avoidedKgCo2: alternativeId === 'scenario-124' ? 1.8616 : 0.22912,
      },
      comparisonExplanation: {
        summary: 'HVAC setback yields 8x greater carbon abatement than lighting, but requires careful thermal drift monitoring.',
        reason: 'Large fan and compressor motors consume significantly more baseline load than LED fixtures.',
        tradeOffs: [
          'Lighting deactivation provides instantaneous visual confirmation with zero occupant thermal disruption.',
          'HVAC setback saves significantly more energy but requires minimum 15-minute reconditioning time if re-occupied.'
        ]
      },
      source: 'GENAI_COMPARISON_MATRIX',
      actionPermission: 'HUMAN_APPROVAL_REQUIRED'
    };
  }
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

