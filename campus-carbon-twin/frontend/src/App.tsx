import React, { useState } from 'react';
import { CampusPage } from './features/campus/CampusPage';
import { RoomPage } from './features/rooms/RoomPage';
import { CameraPage } from './features/camera/CameraPage';
import { CameraStation } from './features/camera-station/CameraStation';
import { ScenarioPage } from './features/scenarios/ScenarioPage';
import { ActionTimeline } from './features/actions/ActionTimeline';
import { PersonalCalculatorPage } from './features/calculator/PersonalCalculatorPage';
import { AuthHeaderWidget } from './auth/AuthHeaderWidget';
import { Room } from './types/api';

type Tab = 'campus' | 'room' | 'camera-station' | 'camera' | 'scenarios' | 'actions' | 'calculator';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('campus');
  const [liveRooms, setLiveRooms] = useState<Room[] | undefined>(undefined);

  // Local callback updating dashboard state for same-device demonstration
  const handleLocalObservation = (roomId: string, count: number, timestamp: string) => {
    setLiveRooms((prevRooms) => {
      if (!prevRooms) return undefined;
      return prevRooms.map((r) => {
        if (r.id === roomId) {
          const isOccupied = count > 0;
          return {
            ...r,
            currentOccupancy: count,
            observationState: isOccupied ? 'OCCUPIED' : 'NO_PERSON_DETECTED',
            lastReceivedAt: timestamp,
            status: !isOccupied && r.powerDrawKw > 1.5 ? 'WASTEFUL' : isOccupied ? 'IN_USE' : 'OPTIMAL',
          };
        }
        return r;
      });
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navigation Header */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🌱</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Campus Carbon Twin</h1>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Zero-PII Edge Intelligence & Energy Mitigation</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', background: '#1e293b', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #334155' }}>
              Grid: <strong style={{ color: '#38bdf8' }}>0.428 kg CO2e/kWh</strong>
            </div>
            <AuthHeaderWidget />
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {[
            { id: 'campus', label: 'Campus Overview' },
            { id: 'room', label: 'Room Inspection' },
            { id: 'camera-station', label: '📷 Camera Station' },
            { id: 'camera', label: 'Edge Camera (Prototype)' },
            { id: 'scenarios', label: 'Scenario Simulator' },
            { id: 'actions', label: 'Action Timeline' },
            { id: 'calculator', label: 'Personal Footprint' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === tab.id ? 600 : 400,
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {activeTab === 'campus' && <CampusPage rooms={liveRooms} />}
        {activeTab === 'room' && <RoomPage />}
        {activeTab === 'camera-station' && (
          <CameraStation
            initialRoomId="A-101"
            onLocalObservation={handleLocalObservation}
          />
        )}
        {activeTab === 'camera' && <CameraPage />}
        {activeTab === 'scenarios' && <ScenarioPage />}
        {activeTab === 'actions' && <ActionTimeline />}
        {activeTab === 'calculator' && <PersonalCalculatorPage />}
      </main>
    </div>
  );
};
