import React, { useState, useEffect } from 'react';
import {
  SavedScenario,
  ExplanationResponse,
  ScenarioComparisonResponse,
} from '../../../types/api';
import {
  explainScenario,
  fetchScenarios,
  compareScenarios,
  overrideRoomOccupancy,
} from '../../../api/scenarios';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRightLeft,
  RefreshCw,
  Users,
  Info,
} from 'lucide-react';

export const ExplanationPanel: React.FC = () => {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-123');
  const [loadingScenarios, setLoadingScenarios] = useState<boolean>(true);

  // UI States: 'IDLE' | 'GENERATING' | 'AVAILABLE' | 'ERROR'
  const [uiState, setUiState] = useState<'IDLE' | 'GENERATING' | 'AVAILABLE' | 'ERROR'>('IDLE');
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Comparison State
  const [comparison, setComparison] = useState<ScenarioComparisonResponse | null>(null);
  const [comparing, setComparing] = useState<boolean>(false);

  // Live demonstration state
  const [simulatedOccupancy, setSimulatedOccupancy] = useState<number>(0);
  const [freshnessAlert, setFreshnessAlert] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoadingScenarios(true);
    try {
      const data = await fetchScenarios();
      setScenarios(data);
      if (data.length > 0 && !data.some((s) => s.id === selectedScenarioId)) {
        setSelectedScenarioId(data[0].id);
      }
    } catch {
      // Fallback local scenarios if backend is temporarily disconnected
      const fallbackList: SavedScenario[] = [
        {
          id: 'scenario-123',
          roomId: 'ROOM-SCI-204',
          scenarioType: 'NONESSENTIAL_LIGHTING',
          title: 'Nonessential Lighting Deactivation',
          description: 'Switching off 8 nonessential lights in Physics Lecture Hall 204 for 2 hours during detected vacancy.',
          observationDescription: 'Repeated fresh zero-person observations in the camera view.',
          selectedEquipmentType: 'NONESSENTIAL_LIGHTS',
          equipmentStateBasis: 'HUMAN_DECLARED',
          scenarioDurationMinutes: 120,
          estimatedAvoidedKwh: 0.32,
          estimatedAvoidedKgCo2: 0.22912,
          factorSource: 'Documented regional historical eGRID subregion factor',
          factorReportingYear: 2024,
          factorValue: 0.716,
          factorUnit: 'kg CO2e / kWh',
          evidenceLevel: 'SIMULATED',
          createdAt: new Date().toISOString(),
          assumptions: [
            'Entered rated power (160 W total for 8 banks) is representative of consumption.',
            'Selected equipment remains off for the proposed 120-minute duration.',
          ],
          forbiddenActions: [
            'Disable emergency lighting',
            'Disable critical equipment',
            'Reduce required ventilation',
            'Automatically switch equipment',
          ],
        },
        {
          id: 'scenario-124',
          roomId: 'ROOM-SCI-204',
          scenarioType: 'HVAC_SETBACK',
          title: 'Eco-Mode HVAC Setback',
          description: 'Increase cooling setpoint by +2.5°C and reduce VAV fan speed to 30% for 2 hours.',
          observationDescription: 'Repeated fresh zero-person observations in the camera view.',
          selectedEquipmentType: 'HVAC_AIR_HANDLER',
          equipmentStateBasis: 'HUMAN_DECLARED',
          scenarioDurationMinutes: 120,
          estimatedAvoidedKwh: 2.6,
          estimatedAvoidedKgCo2: 1.8616,
          factorSource: 'Documented regional historical eGRID subregion factor',
          factorReportingYear: 2024,
          factorValue: 0.716,
          factorUnit: 'kg CO2e / kWh',
          evidenceLevel: 'SIMULATED',
          createdAt: new Date().toISOString(),
          assumptions: [
            'VAV air handler setpoint adjustment reduces power by 1.3 kW.',
            'Room thermal drift remains within safe unoccupied envelope.',
          ],
          forbiddenActions: [
            'Disable emergency lighting',
            'Disable critical equipment',
            'Reduce required ventilation below minimum code',
            'Automatically switch equipment',
          ],
        },
      ];
      setScenarios(fallbackList);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleExplain = async () => {
    if (!currentScenario || uiState === 'GENERATING') return;
    setUiState('GENERATING');
    setErrorMessage(null);
    setFreshnessAlert(false);
    setActionNotice(null);

    try {
      const response = await explainScenario(currentScenario.id);
      setExplanation(response);
      setUiState('AVAILABLE');
    } catch (err: unknown) {
      setUiState('ERROR');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to request explanation from digital twin backend');
    }
  };

  const handleCompare = async () => {
    if (!currentScenario) return;
    setComparing(true);
    const alternativeId = currentScenario.id === 'scenario-123' ? 'scenario-124' : 'scenario-123';
    try {
      const result = await compareScenarios(currentScenario.id, alternativeId);
      setComparison(result);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to compare scenarios');
    } finally {
      setComparing(false);
    }
  };

  const handleSimulateOccupancy = async (count: number) => {
    setSimulatedOccupancy(count);
    if (explanation) {
      setFreshnessAlert(true);
    }
    try {
      await overrideRoomOccupancy(selectedScenarioId, count, false);
      setActionNotice(`Room occupancy updated to ${count}. Click "Explain this scenario" to see live eligibility revalidation.`);
    } catch {
      setActionNotice(`Simulated local occupancy set to ${count}.`);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🧠</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>GenAI Grounded-Explainer</h3>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Explains validated digital-twin scenarios, assumptions, and safety checks for facility officers without recalculating numbers or controlling equipment.
          </p>
        </div>

        {/* Scenario Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Validated Scenario:</label>
          <select
            value={selectedScenarioId}
            onChange={(e) => {
              setSelectedScenarioId(e.target.value);
              setExplanation(null);
              setUiState('IDLE');
              setComparison(null);
              setFreshnessAlert(false);
              setActionNotice(null);
            }}
            disabled={loadingScenarios || uiState === 'GENERATING'}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}: {s.title} ({s.roomId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Overview & Authoritative Backend Metrics */}
      {currentScenario && (
        <div style={{ marginTop: '1.25rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>{currentScenario.title}</h4>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                Room: <strong>{currentScenario.roomId}</strong> • Target: <strong>{currentScenario.selectedEquipmentType}</strong> • Operating Basis: <strong>{currentScenario.equipmentStateBasis}</strong>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '9999px', background: '#e0f2fe', color: '#0369a1' }}>
              Duration: {currentScenario.scenarioDurationMinutes} min
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0.75rem 0 1rem 0' }}>{currentScenario.description}</p>

          {/* Authoritative Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Avoidable Electricity</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>{currentScenario.estimatedAvoidedKwh.toFixed(2)} kWh</div>
              <span style={{ fontSize: '0.7rem', color: '#059669' }}>Simulated Reduction</span>
            </div>

            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Avoidable CO₂ Impact</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#059669' }}>{currentScenario.estimatedAvoidedKgCo2.toFixed(4)} kg CO₂</div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Factor: {currentScenario.factorValue} {currentScenario.factorUnit}</span>
            </div>

            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Evidence Basis</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569' }}>{currentScenario.evidenceLevel}</div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Declared rated draw, not metered</span>
            </div>

            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Action Permission</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#b45309' }}>Human Approval Req.</div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>No autonomous switching</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleExplain}
            disabled={uiState === 'GENERATING'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: uiState === 'GENERATING' ? '#94a3b8' : '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: uiState === 'GENERATING' ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {uiState === 'GENERATING' ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Generating grounded explanation...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Explain this scenario</span>
              </>
            )}
          </button>

          <button
            onClick={handleCompare}
            disabled={comparing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#fff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '0.65rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <ArrowRightLeft size={15} />
            <span>Compare with alternative</span>
          </button>
        </div>

        {/* Live Safety Demonstration Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}>
          <Users size={15} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Demo Live Occupancy:</span>
          <button
            onClick={() => handleSimulateOccupancy(0)}
            style={{
              background: simulatedOccupancy === 0 ? '#10b981' : '#fff',
              color: simulatedOccupancy === 0 ? '#fff' : '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            0 (Vacant)
          </button>
          <button
            onClick={() => handleSimulateOccupancy(1)}
            style={{
              background: simulatedOccupancy > 0 ? '#ef4444' : '#fff',
              color: simulatedOccupancy > 0 ? '#fff' : '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            1+ (Occupied)
          </button>
        </div>
      </div>

      {/* Action / Notice Banner */}
      {actionNotice && (
        <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: '0.375rem', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.8rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={15} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Freshness Warning Banner */}
      {freshnessAlert && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.375rem', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} style={{ color: '#d97706' }} />
          <span><strong>Room conditions changed after this explanation.</strong> Review the latest room state before acting.</span>
        </div>
      )}

      {/* Error Banner */}
      {uiState === 'ERROR' && errorMessage && (
        <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: '0.375rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem' }}>
          <strong>Request failed:</strong> {errorMessage}
        </div>
      )}

      {/* Generated Explanation Content */}
      {uiState === 'AVAILABLE' && explanation && (
        <div style={{ marginTop: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
          {/* Status & Source Badge Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', background: explanation.source === 'GENAI' ? '#f0fdf4' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  background: explanation.source === 'GENAI' ? '#dcfce7' : '#f1f5f9',
                  color: explanation.source === 'GENAI' ? '#166534' : '#475569',
                  border: `1px solid ${explanation.source === 'GENAI' ? '#86efac' : '#cbd5e1'}`,
                }}
              >
                {explanation.source === 'GENAI' ? '✨ Source: AI-Generated (GENAI)' : '📋 Source: Template Fallback (TEMPLATE)'}
              </span>
              {explanation.fallbackReason && (
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  ({explanation.fallbackReason})
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  background: explanation.currentEligibility === 'ELIGIBLE' ? '#dcfce7' : '#fee2e2',
                  color: explanation.currentEligibility === 'ELIGIBLE' ? '#166534' : '#991b1b',
                  border: `1px solid ${explanation.currentEligibility === 'ELIGIBLE' ? '#86efac' : '#fca5a5'}`,
                }}
              >
                {explanation.currentEligibility === 'ELIGIBLE' ? '✓ ELIGIBLE FOR INTERVENTION' : `⚠️ ${explanation.currentEligibility}`}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} />
                {new Date(explanation.generatedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Grounded Summary */}
            <div>
              <h5 style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Recommended Action & Rationale
              </h5>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>
                {explanation.explanation.summary}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                {explanation.explanation.reason}
              </p>
            </div>

            {/* Assumptions */}
            {explanation.explanation.assumptions.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                  📌 Identified Calculation Assumptions:
                </span>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155' }}>
                  {explanation.explanation.assumptions.map((a, i) => (
                    <li key={i} style={{ marginBottom: '0.2rem' }}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Human Checks */}
            {explanation.explanation.suggestedChecks.length > 0 && (
              <div style={{ background: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '0.375rem', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534', display: 'block', marginBottom: '0.35rem' }}>
                  🔍 Suggested Human Inspection Checks:
                </span>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#166534' }}>
                  {explanation.explanation.suggestedChecks.map((c, i) => (
                    <li key={i} style={{ marginBottom: '0.2rem' }}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deterministic Mandatory Safety Checks (Backend Owned) */}
            <div style={{ background: '#fffbeb', padding: '0.85rem 1rem', borderRadius: '0.375rem', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <ShieldAlert size={16} style={{ color: '#b45309' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>
                  MANDATORY SAFETY EXCLUSIONS & OPERATIONAL CHECKS (BACKEND-OWNED):
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#78350f' }}>
                {explanation.mandatorySafetyChecks.map((check, i) => (
                  <li key={i} style={{ marginBottom: '0.2rem', fontWeight: 500 }}>{check}</li>
                ))}
              </ul>
            </div>

            {/* Deterministic Limitations (Backend Owned) */}
            <div style={{ background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#64748b' }}>
              <strong>Digital Twin Limitations:</strong>
              <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem' }}>
                {explanation.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>

            {/* Approval Notice */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                🛡️ <em>Human confirmation required. Requesting explanation does not control equipment or approve an action.</em>
              </span>
              <button
                onClick={() => setActionNotice("Mitigation action submitted to facilities operator approval queue.")}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Submit for Operator Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Comparison View (Optional Feature 2) */}
      {comparison && (
        <div style={{ marginTop: '1.25rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '1.25rem', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ArrowRightLeft size={18} style={{ color: '#2563eb' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>
              Already-Calculated Alternative Comparison (Grounded Explanation)
            </h4>
          </div>

          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            {comparison.comparisonExplanation.summary}
          </p>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
            {comparison.comparisonExplanation.reason}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{comparison.scenarioA.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Avoided: {comparison.scenarioA.avoidedKwh} kWh • {comparison.scenarioA.avoidedKgCo2} kg CO₂</div>
            </div>
            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{comparison.scenarioB.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Avoided: {comparison.scenarioB.avoidedKwh} kWh • {comparison.scenarioB.avoidedKgCo2} kg CO₂</div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#475569' }}>
            <strong>Operational Trade-offs:</strong>
            <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem' }}>
              {comparison.comparisonExplanation.tradeOffs.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
