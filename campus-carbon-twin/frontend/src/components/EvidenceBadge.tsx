import React from 'react';
import { RoomStatus } from '../types/api';

interface EvidenceBadgeProps {
  confidence: number;
  source: string;
  status: RoomStatus;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ confidence, source, status }) => {
  const getBadgeStyle = () => {
    if (status === 'WASTEFUL') {
      return { bg: '#fee2e2', text: '#991b1b', border: '#f87171' };
    }
    if (status === 'IN_USE') {
      return { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' };
    }
    return { bg: '#dcfce7', text: '#166534', border: '#4ade80' };
  };

  const style = getBadgeStyle();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
      title={`Verified by ${source} with ${(confidence * 100).toFixed(0)}% detection confidence`}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: style.text }} />
      <span>{(confidence * 100).toFixed(0)}% AI Conf</span>
    </div>
  );
};
