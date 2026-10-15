import React, { useState, useEffect } from 'react';
import { CampusMap } from '../../components/CampusMap';
import { RoomCard } from '../../components/RoomCard';
import { Room } from '../../types/api';

const INITIAL_ROOMS: Room[] = [
  {
    id: 'A-101',
    name: 'A-101 (Demonstration Room)',
    buildingId: 'BLDG-SCI',
    capacity: 40,
    currentOccupancy: 2,
    status: 'IN_USE',
    powerDrawKw: 2.4,
    emissionRateKgCo2ePerHour: 1.03,
    confidenceScore: 0.94,
    observationState: 'OCCUPIED',
    lastReceivedAt: new Date().toISOString(),
    source: 'Browser camera',
    coverage: 'Demonstration area',
    equipmentState: 'Declared ON',
  },
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
    observationState: 'NO_PERSON_DETECTED',
    lastReceivedAt: new Date(Date.now() - 15000).toISOString(),
    source: 'Browser camera',
    coverage: 'Demonstration area',
    equipmentState: 'Declared ON',
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
    observationState: 'OCCUPIED',
    lastReceivedAt: new Date(Date.now() - 8000).toISOString(),
    source: 'IoT Ceiling Grid',
    coverage: 'Full Lab',
    equipmentState: 'Active',
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
    observationState: 'OCCUPIED',
    lastReceivedAt: new Date(Date.now() - 5000).toISOString(),
    source: 'Edge Station',
    coverage: 'CAD Workstations',
    equipmentState: 'Active',
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
    observationState: 'OCCUPIED',
    lastReceivedAt: new Date(Date.now() - 12000).toISOString(),
    source: 'Overhead Counter',
    coverage: 'Study Pods',
    equipmentState: 'Eco-Mode',
  },
];

interface CampusPageProps {
  rooms?: Room[];
  onRoomSelect?: (roomId: string) => void;
}

export const CampusPage: React.FC<CampusPageProps> = ({ rooms: propRooms, onRoomSelect }) => {
  const [rooms, setRooms] = useState<Room[]>(propRooms || INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('A-101');

  // Sync prop changes
  useEffect(() => {
    if (propRooms) {
      setRooms(propRooms);
    }
  }, [propRooms]);

  // Stale detection loop: checks every 3 seconds if observations stopped (> 20s)
  useEffect(() => {
    const STALE_TIMEOUT_MS = 20000;
    const interval = setInterval(() => {
      setRooms((currentRooms) =>
        currentRooms.map((room) => {
          if (!room.lastReceivedAt) return room;
          const age = Date.now() - new Date(room.lastReceivedAt).getTime();
          if (age > STALE_TIMEOUT_MS && room.observationState !== 'STALE') {
            return {
              ...room,
              observationState: 'STALE',
            };
          }
          return room;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedRoomId(id);
    if (onRoomSelect) {
      onRoomSelect(id);
    }
  };

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
      <CampusMap rooms={rooms} selectedRoomId={selectedRoomId} onSelectRoom={handleSelect} />

      {/* Room Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Monitored Zones & Classrooms</h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Auto-refreshing • Stale timeout 20s
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onSelect={() => handleSelect(room.id)} />
          ))}
        </div>
      </div>
    </div>
  );
};
