import React, { useState } from 'react';
import { CalculationResult } from './types/calculator';
import { FactorDetails } from './FactorDetails';

interface Props {
  result: CalculationResult | null;
  isStale: boolean;
}

export const ResultCard: React.FC<Props> = ({ result, isStale }) => {
  const [showFormula, setShowFormula] = useState<boolean>(true);
  const [showFactors, setShowFactors] = useState<boolean>(false);

  if (!result) {
    return (
      <div className="isolated-calc-card" style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌱</div>
        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#64748b' }}>No Calculation Yet</div>
        <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Enter your activity parameters and click <strong>Calculate</strong> to inspect deterministic emissions.
        </div>
      </div>
    );
  }

  return (
    <div className="isolated-calc-card">
      {isStale && (
        <div className="isolated-calc-stale-notice">
          ⚠️ Input values changed. Result below reflects previous calculation. Click <strong>Calculate</strong> to update.
        </div>
      )}

      {/* Primary Result Box */}
      <div className="isolated-calc-result-box">
        <div className="isolated-calc-result-label">
          {result.activityType} Direct Estimated Emissions
        </div>
        <div className="isolated-calc-result-number">
          {result.estimatedKgCo2.toFixed(4)}
        </div>
        <div className="isolated-calc-result-unit">kg CO₂</div>
        <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.35rem', fontWeight: 500 }}>
          {result.notice}
        </div>
      </div>

      {/* Travel Allocation Card (if applicable) */}
      {result.allocatedKgCo2PerOccupant !== null && result.allocatedKgCo2PerOccupant !== undefined && (
        <div className="isolated-calc-allocated-box">
          <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: '0.25rem' }}>
            👥 Per-Occupant Allocation ({result.inputDetails.occupants} occupants):
          </div>
          <div className="isolated-calc-allocated-number">
            {result.allocatedKgCo2PerOccupant.toFixed(4)} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>kg CO₂ / person</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', fontStyle: 'italic' }}>
            * Note: Allocation divides emissions for personal accounting. It does <strong>not</strong> reduce total vehicle tailpipe emissions.
          </div>
        </div>
      )}

      {/* Quantities summary */}
      {result.quantities && Object.keys(result.quantities).length > 0 && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
          <strong>Activity Summary:</strong>
          <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem', color: '#475569' }}>
            {result.quantities.kwh !== undefined && (
              <li>Electricity: {result.quantities.kwh} {result.quantities.kwhUnit}</li>
            )}
            {result.quantities.estimatedKwh !== undefined && (
              <li>Estimated Electricity: {Number(result.quantities.estimatedKwh).toFixed(4)} {result.quantities.kwhUnit}</li>
            )}
            {result.quantities.fuelLitres !== undefined && (
              <li>Estimated / Entered Fuel: {Number(result.quantities.fuelLitres).toFixed(4)} {result.quantities.fuelUnit}</li>
            )}
          </ul>
        </div>
      )}

      {/* Expandable "How this was calculated" section */}
      <div className="isolated-calc-accordion">
        <button
          type="button"
          className="isolated-calc-accordion-header"
          onClick={() => setShowFormula(!showFormula)}
          aria-expanded={showFormula}
        >
          <span>📐 How this was calculated</span>
          <span>{showFormula ? '▲' : '▼'}</span>
        </button>
        {showFormula && (
          <div className="isolated-calc-accordion-body">
            <div>
              <strong>Formula:</strong>
              <div className="isolated-calc-formula-code">{result.formula}</div>
            </div>
            {result.assumptions && result.assumptions.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Assumptions & Scope Limitations:</strong>
                <ul className="isolated-calc-assumptions-list">
                  {result.assumptions.map((assump, idx) => (
                    <li key={idx}>{assump}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable Factor Provenance & Limitations */}
      <div className="isolated-calc-accordion">
        <button
          type="button"
          className="isolated-calc-accordion-header"
          onClick={() => setShowFactors(!showFactors)}
          aria-expanded={showFactors}
        >
          <span>🏷️ Factor Provenance & Reference Standards</span>
          <span>{showFactors ? '▲' : '▼'}</span>
        </button>
        {showFactors && (
          <div className="isolated-calc-accordion-body">
            <FactorDetails factors={result.factorMetadata} />
          </div>
        )}
      </div>
    </div>
  );
};
