import React from 'react';
import { Room } from '../../types/api';

interface RoomPageProps {
  room?: Room | null;
}

export const RoomPage: React.FC<RoomPageProps> = ({ room }) => {
  if (!room) {
    return (
      <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '3rem 2rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>No Monitored Room Selected</h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
          All mock rooms have been purged. Select a verified room from the Campus Spatial Blueprint or connect live edge sensors to view active loads.
        </p>
      </div>
    );
  }

  const isWasteful = room.status === 'WASTEFUL';

  return (
    <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{room.name}</h2>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Building: {room.buildingId} | Capacity: {room.capacity}</span>
        </div>
        <div style={{
          background: isWasteful ? '#fee2e2' : '#dcfce7',
          color: isWasteful ? '#991b1b' : '#166534',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          fontWeight: 600
        }}>
          Status: {room.status}
        </div>
      </div>

      {isWasteful && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          <strong>⚠️ Anomaly Flagged:</strong> Room is vacant (0 occupants detected via edge sensor) but equipment systems are drawing load ({room.powerDrawKw.toFixed(2)} kW).
        </div>
      )}

      <h3>Subsystem Equipment Inventory</h3>
      {(!room.equipment || room.equipment.length === 0) ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
          No equipment registered for this room.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '0.75rem 0' }}>Equipment</th>
              <th>Type</th>
              <th>Active Draw</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {room.equipment.map((eq) => (
              <tr key={eq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>{eq.name}</td>
                <td style={{ color: '#64748b' }}>{eq.type}</td>
                <td>{(eq.wattageWatts / 1000).toFixed(2)} kW</td>
                <td>
                  <span style={{ color: eq.isActive ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                    {eq.isActive ? 'ACTIVE' : 'STANDBY'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
