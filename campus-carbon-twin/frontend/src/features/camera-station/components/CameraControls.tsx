import React from 'react';
import { CameraState, CameraStationSettings } from '../types';

interface CameraControlsProps {
  roomId: string;
  onRoomChange: (roomId: string) => void;
  consentGiven: boolean;
  onConsentChange: (consent: boolean) => void;
  cameraState: CameraState;
  onStart: () => void;
  onStop: () => void;
  onSwitchCamera: () => void;
  settings: CameraStationSettings;
  onToggleHidePreview: (hide: boolean) => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  roomId,
  onRoomChange,
  consentGiven,
  onConsentChange,
  cameraState,
  onStart,
  onStop,
  onSwitchCamera,
  settings,
  onToggleHidePreview,
}) => {
  const isRunning = cameraState === 'RUNNING';
  const isTransitioning = cameraState === 'REQUESTING_PERMISSION' || cameraState === 'STARTING';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
      {/* Room Selector */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
          Target Classroom / Zone ID
        </label>
        <input
          type="text"
          value={roomId}
          onChange={(e) => onRoomChange(e.target.value)}
          placeholder="Enter verified Room ID"
          disabled={isRunning || isTransitioning}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: '1px solid #cbd5e1',
            fontSize: '0.875rem',
            color: '#0f172a',
            background: isRunning || isTransitioning ? '#f8fafc' : '#ffffff',
          }}
        />
        {isRunning && (
          <span style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.25rem', display: 'block' }}>
            ⚠️ Changing room stops active capture and requires manual restart.
          </span>
        )}
      </div>

      {/* Consent Checkbox */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <input
          type="checkbox"
          id="privacy-consent"
          checked={consentGiven}
          disabled={isRunning || isTransitioning}
          onChange={(e) => onConsentChange(e.target.checked)}
          style={{ marginTop: '3px', cursor: isRunning ? 'not-allowed' : 'pointer' }}
        />
        <label htmlFor="privacy-consent" style={{ fontSize: '0.8125rem', color: '#334155', cursor: isRunning ? 'not-allowed' : 'pointer' }}>
          I consent to local in-browser camera analysis for classroom occupancy detection. No images or video will be uploaded or stored.
        </label>
      </div>

      {/* Button Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        {!isRunning ? (
          <button
            type="button"
            disabled={!consentGiven || isTransitioning}
            onClick={onStart}
            style={{
              background: !consentGiven || isTransitioning ? '#94a3b8' : '#10b981',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: !consentGiven || isTransitioning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isTransitioning ? 'Starting Camera...' : '▶ Start Camera'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ⏹ Stop Camera
          </button>
        )}

        {isRunning && (
          <button
            type="button"
            onClick={onSwitchCamera}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.6rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            🔄 Flip Camera ({settings.facingMode === 'user' ? 'Front' : 'Rear'})
          </button>
        )}

        {isRunning && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#475569', marginLeft: 'auto', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.hidePreview}
              onChange={(e) => onToggleHidePreview(e.target.checked)}
            />
            Hide preview (detection continues)
          </label>
        )}
      </div>
    </div>
  );
};
