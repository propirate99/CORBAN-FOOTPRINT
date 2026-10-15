import React, { useState } from 'react';
import { CampusMap } from '../../components/CampusMap';
import { RoomCard } from '../../components/RoomCard';
import { Room } from '../../types/api';

const MOCK_ROOMS: Room[] = [
  {
    id: 'ROOM-SCI-204',
    name: 'Physics Lecture Hall 204',
    buildingId: 'BLDG-SCI',
    capacity: 120,
    currentOccupancy: 0,
    status: 'WASTEFUL',
    powerDrawKw: 4.8,
    emissionRateKgCo2ePerHour: 2.05,
    confidenceScore: 0.94,
  },
  {
    id: 'ROOM-SCI-101',
    name: 'Bio-Lab 101',
    buildingId: 'BLDG-SCI',
    capacity: 30,
    currentOccupancy: 18,
    status: 'IN_USE',
    powerDrawKw: 2.2,
    emissionRateKgCo2ePerHour: 0.94,
    confidenceScore: 0.91,
  },
  {
    id: 'ROOM-ENG-220',
    name: 'Computer Architecture Lab',
    buildingId: 'BLDG-ENG',
    capacity: 60,
    currentOccupancy: 42,
    status: 'IN_USE',
    powerDrawKw: 6.4,
    emissionRateKgCo2ePerHour: 2.73,
    confidenceScore: 0.96,
  },
  {
    id: 'ROOM-LIB-100',
    name: 'Main Reading Room',
    buildingId: 'BLDG-LIB',
    capacity: 200,
    currentOccupancy: 110,
    status: 'OPTIMAL',
    powerDrawKw: 3.1,
    emissionRateKgCo2ePerHour: 1.32,
    confidenceScore: 0.89,
  },
];

export const CampusPage: React.FC = () => {
  const [rooms] = useState<Room[]>(MOCK_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ROOM-SCI-204');

  const totalPower = rooms.reduce((acc, r) => acc + r.powerDrawKw, 0);
  const totalEmissions = rooms.reduce((acc, r) => acc + r.emissionRateKgCo2ePerHour, 0);
  const wasteCount = rooms.filter((r) => r.status === 'WASTEFUL').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Campus Load</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{totalPower.toFixed(1)} kW</div>
        </div>
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Hourly Emissions</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{totalEmissions.toFixed(2)} kg CO2e/h</div>
        </div>
        <div style={{ background: '#fee2e2', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #f87171' }}>
          <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>Active Waste Alerts</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#b91c1c' }}>{wasteCount} Rooms Flagged</div>
        </div>
      </div>

      {/* Blueprint Map */}
      <CampusMap rooms={rooms} selectedRoomId={selectedRoomId} onSelectRoom={setSelectedRoomId} />

      {/* Room Grid */}
      <div>
        <h3 style={{ marginBottom: '1rem', color: '#0f172a' }}>Monitored Zones & Classrooms</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onSelect={() => setSelectedRoomId(room.id)} />
          ))}
        </div>
      </div>
    </div>
  );
};
