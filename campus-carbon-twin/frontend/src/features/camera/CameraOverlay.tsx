import React from 'react';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

interface CameraOverlayProps {
  boxes?: Box[];
  personCount: number;
  videoWidth: number;
  videoHeight: number;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({ boxes, personCount, videoWidth, videoHeight }) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {boxes?.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${b.x * 100}%`,
            top: `${b.y * 100}%`,
            width: `${b.width * 100}%`,
            height: `${b.height * 100}%`,
            border: '2px solid #10b981',
            borderRadius: '4px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
          }}
        >
          <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', padding: '2px 4px', position: 'absolute', top: 0, left: 0 }}>
            Person: {(b.score * 100).toFixed(0)}%
          </span>
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
        }}
      >
        Edge Occupancy: <strong>{personCount}</strong> (Zero-PII Local)
      </div>
    </div>
  );
};
