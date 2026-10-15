import React from 'react';
import { CameraState, DetectorState, PublisherState, DetectionResult, ObservationAck } from '../types';

interface CameraStatusPanelProps {
  cameraState: CameraState;
  detectorState: DetectorState;
  publisherState: PublisherState;
  cameraError: string | null;
  detectorError: string | null;
  publisherError: string | null;
  latestDetection: DetectionResult | null;
  lastAck: ObservationAck | null;
  roomId: string;
}

export const CameraStatusPanel: React.FC<CameraStatusPanelProps> = ({
  cameraState,
  detectorState,
  publisherState,
  cameraError,
  detectorError,
  publisherError,
  latestDetection,
  lastAck,
  roomId,
}) => {
  const getStatusBadge = (state: string) => {
    let bg = '#f1f5f9';
    let text = '#475569';

    if (state === 'RUNNING' || state === 'READY' || state === 'CONNECTED') {
      bg = '#dcfce7';
      text = '#15803d';
    } else if (state === 'STARTING' || state === 'LOADING' || state === 'SENDING' || state === 'REQUESTING_PERMISSION') {
      bg = '#e0f2fe';
      text = '#0369a1';
    } else if (state === 'ERROR') {
      bg = '#fee2e2';
      text = '#b91c1c';
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: bg,
          color: text,
        }}
      >
        {state}
      </span>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: '#fff',
        padding: '1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
      }}
    >
      <h4 style={{ margin: 0, fontSize: '0.9375rem', color: '#0f172a' }}>Station Diagnostics & Pipeline Status</h4>

      {/* 3 Separate State Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>1. Device Camera</div>
          <div style={{ marginTop: '0.25rem' }}>{getStatusBadge(cameraState)}</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>2. MediaPipe Detection</div>
          <div style={{ marginTop: '0.25rem' }}>{getStatusBadge(detectorState)}</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>3. Backend Publishing</div>
          <div style={{ marginTop: '0.25rem' }}>{getStatusBadge(publisherState)}</div>
        </div>
      </div>

      {/* Numerical Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
        <div>
          <span style={{ color: '#64748b' }}>Assigned Room:</span>{' '}
          <strong style={{ color: '#0f172a' }}>{roomId}</strong>
        </div>

        <div>
          <span style={{ color: '#64748b' }}>Coverage Area:</span>{' '}
          <strong style={{ color: '#0f172a' }}>Demonstration area</strong>
        </div>

        <div>
          <span style={{ color: '#64748b' }}>Last Detection:</span>{' '}
          <strong style={{ color: '#0f172a' }}>
            {latestDetection ? new Date(latestDetection.wallClockIso).toLocaleTimeString() : 'None'}
          </strong>
        </div>

        <div>
          <span style={{ color: '#64748b' }}>Last Backend Ack:</span>{' '}
          <strong style={{ color: '#0f172a' }}>
            {lastAck ? new Date(lastAck.receivedAt).toLocaleTimeString() : 'None yet'}
          </strong>
        </div>
      </div>

      {/* Error Banners */}
      {cameraError && (
        <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', fontSize: '0.8125rem' }}>
          📷 <strong>Camera Error:</strong> {cameraError}
        </div>
      )}
      {detectorError && (
        <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', fontSize: '0.8125rem' }}>
          🧠 <strong>Detection Error:</strong> {detectorError}
        </div>
      )}
      {publisherError && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', padding: '0.6rem 0.8rem', borderRadius: '0.375rem', fontSize: '0.8125rem' }}>
          📡 <strong>Publishing Notice:</strong> {publisherError}
        </div>
      )}
    </div>
  );
};
