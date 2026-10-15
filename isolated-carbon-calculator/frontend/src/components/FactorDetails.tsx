import React from 'react';
import { FactorDto } from '../types/calculator';

interface Props {
  factors: FactorDto[];
}

export const FactorDetails: React.FC<Props> = ({ factors }) => {
  if (!factors || factors.length === 0) return null;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      {factors.map((factor) => (
        <div key={factor.id} className="isolated-calc-provenance-card">
          <div className="isolated-calc-provenance-title">
            📌 {factor.name} ({factor.id})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 0.75rem', marginTop: '0.5rem' }}>
            <strong>Value:</strong>
            <span>
              {factor.value.toFixed(5)} {factor.unit}
            </span>

            <strong>Source:</strong>
            <span>{factor.sourceName}</span>

            <strong>Geography:</strong>
            <span>{factor.geography}</span>

            <strong>Status / Period:</strong>
            <span>{factor.reportingPeriodOrStatus}</span>

            <strong>Boundary:</strong>
            <span>{factor.emissionsBoundary}</span>

            <strong>Limitations:</strong>
            <span style={{ color: '#b45309' }}>{factor.limitations}</span>
          </div>

          {factor.notice && (
            <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#64748b', fontSize: '0.75rem' }}>
              Notice: {factor.notice}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
