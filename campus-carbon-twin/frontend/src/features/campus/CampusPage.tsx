import React, { useState, useEffect } from 'react';
import { CampusMap } from '../../components/CampusMap';
import { RoomCard } from '../../components/RoomCard';
import { Room } from '../../types/api';

const INITIAL_ROOMS: Room[] = [];

interface CampusPageProps {
  rooms?: Room[];
  onRoomSelect?: (roomId: string) => void;
}

export const CampusPage: React.FC<CampusPageProps> = ({ rooms: propRooms, onRoomSelect }) => {
  const [rooms, setRooms] = useState<Room[]>(propRooms || INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

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
        {rooms.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '0.75rem',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px dashed #cbd5e1'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.1rem' }}>
              No Monitored Rooms Configured
            </h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              All mock and demo zones have been purged. Connect real camera feeds or publish observations to start tracking verified campus spatial emissions.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onSelect={() => handleSelect(room.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
