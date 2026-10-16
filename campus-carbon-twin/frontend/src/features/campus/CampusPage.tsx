import React, { useState, useEffect, useCallback } from 'react';
import { CampusMap } from '../../components/CampusMap';
import { RoomCard } from '../../components/RoomCard';
import { Room } from '../../types/api';
import { getRooms } from '../../api/rooms';
import { isSupabaseConfigured } from '../../lib/supabase';

const DEMO_FIXTURE_ROOMS: Room[] = [
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
  // If Supabase is configured, default to LIVE mode. Otherwise default to DEMO.
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured());
  const [rooms, setRooms] = useState<Room[]>(propRooms || (isSupabaseConfigured() ? [] : DEMO_FIXTURE_ROOMS));
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ROOM-SCI-204');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [isDataStale, setIsDataStale] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLiveRooms = useCallback(async () => {
    if (isDemoMode) return;
    setLoading(true);
    try {
      const data = await getRooms();
      setRooms(data);
      setErrorMessage(null);
      setIsDataStale(false);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      // NEVER silently fall back! Surface explicit error state
      setErrorMessage(err?.message || 'Failed to fetch authorized campus rooms from Supabase');
      if (rooms.length > 0) {
        setIsDataStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, rooms.length]);

  useEffect(() => {
    if (propRooms) {
      setRooms(propRooms);
      return;
    }
    if (!isDemoMode) {
      fetchLiveRooms();
    } else {
      setRooms(DEMO_FIXTURE_ROOMS);
      setErrorMessage(null);
      setIsDataStale(false);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [propRooms, isDemoMode, fetchLiveRooms]);

  // Periodic refresh when in Live mode
  useEffect(() => {
    if (isDemoMode) return;
    const pollInterval = setInterval(() => {
      fetchLiveRooms();
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [isDemoMode, fetchLiveRooms]);

  // Stale detection loop for observations: checks every 3s if individual room observation is >20s old
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

  const totalPower = rooms.reduce((acc, r) => acc + (r.powerDrawKw || 0), 0);
  const totalEmissions = rooms.reduce((acc, r) => acc + (r.emissionRateKgCo2ePerHour || 0), 0);
  const wasteCount = rooms.filter((r) => r.status === 'WASTEFUL').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Mode, Sync & Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        padding: '0.75rem 1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '0.75rem',
            background: isDemoMode ? '#fef3c7' : '#dcfce7',
            color: isDemoMode ? '#92400e' : '#166534',
            border: `1px solid ${isDemoMode ? '#fde68a' : '#bbf7d0'}`
          }}>
            {isDemoMode ? '🟡 DEMO FIXTURE MODE' : '🟢 LIVE RLS-AUTHORIZED MODE'}
          </span>
          <span style={{ color: '#64748b' }}>
            Last Updated: <strong style={{ color: '#0f172a' }}>{lastUpdated}</strong>
          </span>
          {isDataStale && (
            <span style={{ color: '#dc2626', fontWeight: 600, background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
              ⚠️ STALE DATA
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isDemoMode && (
            <button
              onClick={() => fetchLiveRooms()}
              disabled={loading}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Live'}
            </button>
          )}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            style={{
              background: isDemoMode ? '#0284c7' : '#f8fafc',
              color: isDemoMode ? '#fff' : '#0284c7',
              border: '1px solid #0284c7',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            {isDemoMode ? 'Switch to Live Mode' : 'Switch to Demo Mode'}
          </button>
        </div>
      </div>

      {/* Explicit Error Banner - Surface on Failure (Rule 3) */}
      {errorMessage && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
            ⚠️ Supabase RLS Read Error
          </div>
          <div>{errorMessage}</div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#b91c1c' }}>
            * Operational Rule: Live data was NOT replaced with mock fixtures. Existing cached data (if any) is flagged as STALE.
          </div>
        </div>
      )}

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
            {isDemoMode ? 'Demo Sandbox' : 'Authenticated Campus Rooms'} • Stale timeout 20s
          </span>
        </div>
        {rooms.length === 0 && !loading && !errorMessage ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: '0.5rem', color: '#64748b' }}>
            No authorized rooms found for your active campus membership.
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
