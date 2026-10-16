import React from 'react';
import { DetectionOverlay } from './DetectionOverlay';
import { CameraState, DetectionResult } from '../types';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraState: CameraState;
  facingMode: 'user' | 'environment';
  hidePreview: boolean;
  latestDetection: DetectionResult | null;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  cameraState,
  facingMode,
  hidePreview,
  latestDetection,
}) => {
  const isRunning = cameraState === 'RUNNING';
  const isMirrored = facingMode === 'user';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '640px',
        aspectRatio: '4 / 3',
        background: '#090d16',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* HTML5 Video Element (Muted, PlaysInline, AutoPlay) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isRunning && !hidePreview ? 'block' : 'none',
          transform: isMirrored ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Local Overlay */}
      {isRunning && !hidePreview && latestDetection && (
        <DetectionOverlay
          boxes={latestDetection.boxes}
          personCount={latestDetection.personCount}
          mirrored={isMirrored}
        />
      )}

      {/* Placeholder / State Screens */}
      {cameraState === 'IDLE' && (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>Camera Idle</div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            Check the privacy consent box and click Start to begin local edge detection.
          </div>
        </div>
      )}

      {cameraState === 'REQUESTING_PERMISSION' && (
        <div style={{ textAlign: 'center', color: '#38bdf8', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
          <div style={{ fontWeight: 600 }}>Waiting for browser permission...</div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Please approve camera access in your browser prompt.
          </div>
        </div>
      )}

      {cameraState === 'STARTING' && (
        <div style={{ textAlign: 'center', color: '#38bdf8' }}>
          <div>Initializing video stream and local detector...</div>
        </div>
      )}

      {cameraState === 'STOPPED' && (
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛑</div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>Capture Stopped</div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            All camera media tracks have been released.
          </div>
        </div>
      )}

      {isRunning && hidePreview && (
        <div style={{ textAlign: 'center', color: '#38bdf8', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👁️‍🗨️</div>
          <div style={{ fontWeight: 600 }}>Preview Hidden</div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Local person detection and backend observation publishing continue actively in background.
          </div>
          {latestDetection && (
            <div style={{ marginTop: '0.75rem', fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>
              Occupants: {latestDetection.personCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
