import React from 'react';

export const PrivacyNotice: React.FC = () => {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '0.5rem',
        padding: '1rem',
        fontSize: '0.8125rem',
        color: '#334155',
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.1rem' }}>🛡️</span>
        <strong style={{ color: '#0f172a' }}>Privacy-First Edge Architecture</strong>
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <li>
          <strong>In-browser local inference:</strong> Camera video frames are processed completely in device memory using MediaPipe WASM.
        </li>
        <li>
          <strong>Zero image or video uploads:</strong> No video streams, photos, screenshots, or face crops ever leave this device.
        </li>
        <li>
          <strong>No facial recognition:</strong> The model detects only general human shapes (COCO person category) to count occupants.
        </li>
        <li>
          <strong>Aggregate data only:</strong> Only an anonymous numerical count (e.g. <code>2 people</code>) and timestamp are sent to the campus twin backend.
        </li>
      </ul>
    </div>
  );
};
