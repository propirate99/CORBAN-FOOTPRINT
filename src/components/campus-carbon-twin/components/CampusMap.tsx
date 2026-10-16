import React from 'react';
import { Room } from '../types/api';

interface CampusMapProps {
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  selectedRoomId?: string;
}

export const CampusMap: React.FC<CampusMapProps> = ({ rooms, onSelectRoom, selectedRoomId }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WASTEFUL':
        return '#ef4444'; // Red/Warning
      case 'IN_USE':
        return '#3b82f6'; // Blue
      case 'OPTIMAL':
        return '#10b981'; // Green
      default:
        return '#9ca3af'; // Gray
    }
  };

  return (
    <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Campus Spatial Twin (2D Blueprint)</h3>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> Optimal
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} /> In Use
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> Waste Alert
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {rooms.map((room) => {
          const isSelected = room.id === selectedRoomId;
          const statusColor = getStatusColor(room.status);
          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              style={{
                background: isSelected ? '#334155' : '#0f172a',
                border: `2px solid ${isSelected ? '#60a5fa' : statusColor}`,
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#fff',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{room.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cap: {room.capacity} | Occ: {room.currentOccupancy}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>{room.powerDrawKw.toFixed(1)} kW</span>
                <span style={{ color: statusColor, fontWeight: 700 }}>{room.status}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
