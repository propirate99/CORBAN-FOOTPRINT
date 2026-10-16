import React from 'react';
import { Room } from '../../types/api';

const SAMPLE_ROOM: Room = {
  id: 'ROOM-SCI-204',
  name: 'Physics Lecture Hall 204',
  buildingId: 'BLDG-SCI',
  capacity: 120,
  currentOccupancy: 0,
  status: 'WASTEFUL',
  powerDrawKw: 4.82,
  emissionRateKgCo2ePerHour: 2.06,
  confidenceScore: 0.94,
  equipment: [
    { id: 'EQ-1', name: 'Air Handler Unit 204 (VAV)', roomId: 'ROOM-SCI-204', type: 'HVAC', isActive: true, wattageWatts: 3800 },
    { id: 'EQ-2', name: 'Ceiling Lighting Grid (40 Banks)', roomId: 'ROOM-SCI-204', type: 'LIGHTING', isActive: true, wattageWatts: 600 },
    { id: 'EQ-3', name: 'Laser Projector System', roomId: 'ROOM-SCI-204', type: 'PROJECTOR', isActive: true, wattageWatts: 420 },
  ],
};

export const RoomPage: React.FC = () => {
  const room = SAMPLE_ROOM;

  return (
    <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{room.name}</h2>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Building: Science & Innovation Hall | Capacity: {room.capacity}</span>
        </div>
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600 }}>
          Status: WASTEFUL OCCUPANCY
        </div>
      </div>

      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
        <strong>⚠️ Anomaly Flagged:</strong> Room is completely vacant (0 occupants detected via edge camera with 94% confidence) but full HVAC and lighting systems are running at active load (4.82 kW).
      </div>

      <h3>Subsystem Equipment Inventory</h3>
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
          {room.equipment?.map((eq) => (
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
    </div>
  );
};
