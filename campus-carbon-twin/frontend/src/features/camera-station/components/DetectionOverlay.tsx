import React from 'react';
import { DetectedBox } from '../types';

interface DetectionOverlayProps {
  boxes: DetectedBox[];
  personCount: number;
  mirrored?: boolean;
}

export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  boxes,
  personCount,
  mirrored = false,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        transform: mirrored ? 'scaleX(-1)' : 'none',
      }}
    >
      {/* Local Bounding Boxes */}
      {boxes.map((b, idx) => {
        const leftPct = b.x * 100;
        const topPct = b.y * 100;
        const widthPct = b.width * 100;
        const heightPct = b.height * 100;

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
              border: '2px solid #10b981',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-20px',
                left: '0px',
                background: '#10b981',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '3px',
                transform: mirrored ? 'scaleX(-1)' : 'none', // Keep label readable if mirrored
              }}
            >
              Person {(b.score * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}

      {/* Local Status Banner (Un-mirrored) */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#fff',
          padding: '6px 14px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          backdropFilter: 'blur(4px)',
          transform: mirrored ? 'scaleX(-1)' : 'none', // Keep banner readable
        }}
      >
        {personCount > 0 ? (
          <span>
            🟢 <strong>{personCount}</strong> {personCount === 1 ? 'person' : 'people'} detected (Local AI)
          </span>
        ) : (
          <span>⚪ No person detected in camera view</span>
        )}
      </div>
    </div>
  );
};
