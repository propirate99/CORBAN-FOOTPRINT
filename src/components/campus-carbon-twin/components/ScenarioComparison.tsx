import React from 'react';
import { ScenarioResult } from '../types/api';

interface ScenarioComparisonProps {
  result: ScenarioResult;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ result }) => {
  return (
    <div style={{ background: '#ffffff', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#0f172a' }}>Scenario Impact Analysis</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Baseline Monthly CO2e</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#475569' }}>
            {result.baselineMonthlyCo2eKg.toLocaleString()} <span style={{ fontSize: '0.875rem' }}>kg</span>
          </div>
        </div>

        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#047857' }}>Projected Monthly CO2e</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
            {result.projectedMonthlyCo2eKg.toLocaleString()} <span style={{ fontSize: '0.875rem' }}>kg</span>
          </div>
        </div>

        <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#1d4ed8' }}>Monthly Reduction</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>
            -{result.netReductionPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '0.5rem', color: '#15803d', fontSize: '0.875rem' }}>
        💡 <strong>Estimated Annual Cost Savings:</strong> ${(result.annualCostSavingsUsd).toLocaleString()} USD
      </div>
    </div>
  );
};
