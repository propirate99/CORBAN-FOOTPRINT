import React from 'react';

interface ObservationStatusProps {
  isPublishing: boolean;
  lastSuccessTimestamp?: string;
  count: number;
}

export const ObservationStatus: React.FC<ObservationStatusProps> = ({ isPublishing, lastSuccessTimestamp, count }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#f1f5f9',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.8rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isPublishing ? '#10b981' : '#f59e0b',
            animation: isPublishing ? 'pulse 2s infinite' : 'none',
          }}
        />
        <strong>{isPublishing ? 'Edge Live Stream Active' : 'Edge Idle'}</strong>
      </div>

      <div style={{ color: '#475569' }}>
        Detected Occupants: <strong>{count}</strong>
      </div>

      {lastSuccessTimestamp && (
        <div style={{ color: '#64748b', marginLeft: 'auto' }}>
          Last Synced: {new Date(lastSuccessTimestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
