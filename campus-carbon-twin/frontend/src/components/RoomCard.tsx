import React from 'react';
import { Room } from '../types/api';
import { EvidenceBadge } from './EvidenceBadge';

interface RoomCardProps {
  room: Room;
  onSelect?: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect }) => {
  const isWaste = room.status === 'WASTEFUL';

  return (
    <div
      onClick={onSelect}
      style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        border: `1px solid ${isWaste ? '#fca5a5' : '#e2e8f0'}`,
        boxShadow: isWaste ? '0 0 12px rgba(239, 68, 68, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
        padding: '1.25rem',
        cursor: onSelect ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{room.name}</h4>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Room ID: {room.id}</span>
        </div>
        <EvidenceBadge
          confidence={room.confidenceScore || 0.92}
          source="Edge Camera"
          status={room.status}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Current Occupancy</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            {room.currentOccupancy} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ {room.capacity}</span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Hourly Carbon Draw</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isWaste ? '#dc2626' : '#059669' }}>
            {room.emissionRateKgCo2ePerHour.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kg/h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
