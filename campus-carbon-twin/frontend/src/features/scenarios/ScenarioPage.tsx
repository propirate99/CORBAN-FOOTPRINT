import React, { useState } from 'react';
import { ScenarioComparison } from '../../components/ScenarioComparison';
import { ScenarioResult } from '../../types/api';

export const ScenarioPage: React.FC = () => {
  const [tempDelta, setTempDelta] = useState<number>(2.0);
  const [autoShutoff, setAutoShutoff] = useState<boolean>(true);
  const [solarKw, setSolarKw] = useState<number>(150);

  const baselineCo2e = 48500;
  // Calculate projected savings based on inputs
  const hvacSavings = tempDelta * 0.04 * baselineCo2e;
  const shutoffSavings = autoShutoff ? 0.12 * baselineCo2e : 0;
  const solarSavings = solarKw * 120 * 0.428;
  const totalSavings = Math.min(baselineCo2e * 0.45, hvacSavings + shutoffSavings + solarSavings);
  const projectedCo2e = baselineCo2e - totalSavings;
  const pct = (totalSavings / baselineCo2e) * 100;
  const rupeeSavings = totalSavings * 15.0; // ~₹15.0 per kg CO2e saved
  const result: ScenarioResult = {
    scenarioName: 'Combined Campus Efficiency Optimization',
    baselineMonthlyCo2eKg: baselineCo2e,
    projectedMonthlyCo2eKg: projectedCo2e,
    netReductionPercentage: pct,
    annualCostSavingsUsd: rupeeSavings * 12,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
        <h2 style={{ marginTop: 0 }}>What-If Campus Carbon Simulator</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Adjust operational levers to simulate future monthly emissions reductions and cost savings across campus buildings.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Thermostat Setback: +{tempDelta}°C
            </label>
            <input
              type="range"
              min="0"
              max="4"
              step="0.5"
              value={tempDelta}
              onChange={(e) => setTempDelta(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={autoShutoff}
                onChange={(e) => setAutoShutoff(e.target.checked)}
              />
              Auto-Shutoff Vacant Classrooms
            </label>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Triggers setback when empty for &gt; 10 min</span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Rooftop Solar Array: {solarKw} kW
            </label>
            <input
              type="range"
              min="0"
              max="500"
              step="25"
              value={solarKw}
              onChange={(e) => setSolarKw(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      <ScenarioComparison result={result} />
    </div>
  );
};
