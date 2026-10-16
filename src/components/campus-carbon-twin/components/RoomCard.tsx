import React from 'react';
import { Room } from '../types/api';
import { EvidenceBadge } from './EvidenceBadge';

interface RoomCardProps {
  room: Room;
  onSelect?: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect }) => {
  const isWaste = room.status === 'WASTEFUL';
  const isStale = room.observationState === 'STALE';
  const obsState = room.observationState || (room.currentOccupancy > 0 ? 'OCCUPIED' : 'NO_PERSON_DETECTED');

  const getObservationText = () => {
    switch (obsState) {
      case 'OCCUPIED':
        return 'Occupied';
      case 'NO_PERSON_DETECTED':
        return 'No person detected';
      case 'VACANCY_CANDIDATE':
        return 'Vacancy Candidate';
      case 'STALE':
        return 'Stale';
      default:
        return 'Unknown';
    }
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Not available';
    const seconds = Math.max(0, Math.round((Date.now() - new Date(isoString).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.round(seconds / 60)}m ago`;
  };

  return (
    <div
      onClick={onSelect}
      style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        border: `1px solid ${isStale ? '#f59e0b' : isWaste ? '#fca5a5' : '#e2e8f0'}`,
        boxShadow: isWaste ? '0 0 12px rgba(239, 68, 68, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
        padding: '1.25rem',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{room.name}</h4>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Room: {room.id}</span>
        </div>
        <EvidenceBadge
          confidence={room.confidenceScore || 0.92}
          source={room.source || 'Browser camera'}
          status={room.status}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>People Detected</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            {isStale ? (
              <span style={{ fontSize: '0.8125rem', color: '#d97706' }}>Last observed {room.currentOccupancy}</span>
            ) : (
              `${room.currentOccupancy} / ${room.capacity}`
            )}
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Hourly Carbon Draw</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isWaste ? '#dc2626' : '#059669' }}>
            {room.emissionRateKgCo2ePerHour.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kg/h</span>
          </div>
        </div>
      </div>

      {/* Observation Metadata Details */}
      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Observation:</span>
          <strong style={{ color: isStale ? '#b45309' : '#0f172a' }}>{getObservationText()}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Last received:</span>
          <span>{getRelativeTime(room.lastReceivedAt || room.lastObservationTimestamp)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Source:</span>
          <span>{room.source || 'Browser camera'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Coverage:</span>
          <span>{room.coverage || 'Demonstration area'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Equipment:</span>
          <span style={{ color: isWaste ? '#dc2626' : '#15803d', fontWeight: 600 }}>{room.equipmentState || 'Declared ON'}</span>
        </div>

        {isStale && (
          <div style={{ marginTop: '4px', background: '#fef3c7', color: '#92400e', padding: '4px 6px', borderRadius: '4px', fontWeight: 500 }}>
            ⚠️ New occupancy-based recommendations: Unavailable (Observation Stale)
          </div>
        )}
      </div>
    </div>
  );
};
