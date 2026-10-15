import React from 'react';
import { CameraStationSettings } from '../types';
import { CAMERA_CONFIG } from '../config';

interface ObservationSettingsProps {
  settings: CameraStationSettings;
  onChange: (updated: Partial<CameraStationSettings>) => void;
  disabled?: boolean;
}

export const ObservationSettings: React.FC<ObservationSettingsProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        background: '#fff',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
      }}
    >
      <div>
        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#334155',
            marginBottom: '0.375rem',
          }}
        >
          <span>Person Confidence Threshold</span>
          <span style={{ color: '#0284c7' }}>{(settings.confidenceThreshold * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min={CAMERA_CONFIG.minConfidenceThreshold}
          max={CAMERA_CONFIG.maxConfidenceThreshold}
          step="0.05"
          value={settings.confidenceThreshold}
          disabled={disabled}
          onChange={(e) => onChange({ confidenceThreshold: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
          <span>20% (More sensitive)</span>
          <span>95% (Strict)</span>
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#334155',
            marginBottom: '0.375rem',
          }}
        >
          Publishing Interval
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {CAMERA_CONFIG.publishIntervalOptionsMs.map((ms) => {
            const isSelected = settings.publishIntervalMs === ms;
            return (
              <button
                key={ms}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ publishIntervalMs: ms })}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 600 : 400,
                  borderRadius: '0.375rem',
                  border: isSelected ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  background: isSelected ? '#e0f2fe' : '#f8fafc',
                  color: isSelected ? '#0369a1' : '#475569',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {ms / 1000}s
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.375rem' }}>
          Backend stale timeout is {CAMERA_CONFIG.backendObservationStaleTimeoutMs / 1000}s.
        </div>
      </div>
    </div>
  );
};
