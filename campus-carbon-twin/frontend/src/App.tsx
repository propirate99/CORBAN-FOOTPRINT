import React, { useState } from 'react';
import {
  LayoutDashboard,
  DoorOpen,
  Video,
  Camera,
  Sliders,
  Activity,
  Calculator,
  Leaf,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { CampusPage } from './features/campus/CampusPage';
import { RoomPage } from './features/rooms/RoomPage';
import { CameraPage } from './features/camera/CameraPage';
import { CameraStation } from './features/camera-station/CameraStation';
import { ScenarioPage } from './features/scenarios/ScenarioPage';
import { ActionTimeline } from './features/actions/ActionTimeline';
import { PersonalCalculatorPage } from './features/calculator/PersonalCalculatorPage';
import { Room } from './types/api';

type Tab = 'campus' | 'room' | 'camera-station' | 'camera' | 'scenarios' | 'actions' | 'calculator';

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'campus', label: 'Campus Overview', icon: LayoutDashboard },
  { id: 'room', label: 'Room Inspection', icon: DoorOpen },
  { id: 'camera-station', label: 'Camera Station', icon: Video, badge: 'Live', badgeColor: '#10b981' },
  { id: 'camera', label: 'Edge Camera (Prototype)', icon: Camera },
  { id: 'scenarios', label: 'Scenario Simulator', icon: Sliders },
  { id: 'actions', label: 'Action Timeline', icon: Activity },
  { id: 'calculator', label: 'Personal Footprint', icon: Calculator },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('campus');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
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

  const currentTabInfo = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: isCollapsed ? '76px' : '270px',
          backgroundColor: '#0f172a',
          color: '#fff',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
          zIndex: 40,
          boxShadow: '4px 0 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: isCollapsed ? '1.25rem 0.75rem' : '1.25rem 1.25rem',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Leaf size={20} color="#ffffff" />
            </div>
            {!isCollapsed && (
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '-0.01em', color: '#f8fafc' }}>
                  Campus Carbon Twin
                </h1>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                  <ShieldCheck size={12} color="#10b981" />
                  <span>Zero-PII Edge AI</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#94a3b8',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.2s, color 0.2s',
            }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Section Header */}
        {!isCollapsed && (
          <div style={{ padding: '1rem 1.25rem 0.4rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
            Digital Twin Modules
          </div>
        )}

        {/* Navigation List */}
        <nav style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCollapsed ? '0' : '0.85rem',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: isCollapsed ? '0.75rem 0' : '0.75rem 0.95rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                  borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                }}
                title={isCollapsed ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '22px' }}>
                  <Icon size={19} color={isActive ? '#38bdf8' : 'currentColor'} />
                </div>
                {!isCollapsed && (
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      background: 'rgba(16, 185, 129, 0.18)',
                      color: item.badgeColor || '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Card */}
        <div style={{ padding: '1rem 0.85rem', borderTop: '1px solid #1e293b', backgroundColor: '#0b1120' }}>
          {isCollapsed ? (
            <div style={{ display: 'flex', justifyContent: 'center' }} title="Grid: 0.428 kg CO2e/kWh">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #334155',
                }}
              >
                <Zap size={16} color="#38bdf8" />
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#1e293b',
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Grid Emission Factor
                </span>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'inline-block',
                    boxShadow: '0 0 6px #10b981',
                  }}
                  title="Live Grid Feed Active"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Zap size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
                  0.428 <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#94a3b8' }}>kg CO₂e/kWh</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Top Header Bar */}
        <header
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              Campus Carbon Twin &gt; <span style={{ color: '#0f172a', fontWeight: 600 }}>{currentTabInfo.label}</span>
            </div>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              {currentTabInfo.label}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                fontSize: '0.8rem',
                background: '#f1f5f9',
                color: '#334155',
                padding: '5px 12px',
                borderRadius: '9999px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
              <span style={{ fontWeight: 600 }}>Real-Time Inference Active</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1350px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {activeTab === 'campus' && <CampusPage rooms={liveRooms} />}
          {activeTab === 'room' && <RoomPage />}
          {activeTab === 'camera-station' && (
            <CameraStation
              initialRoomId=""
              onLocalObservation={handleLocalObservation}
            />
          )}
          {activeTab === 'camera' && <CameraPage />}
          {activeTab === 'scenarios' && <ScenarioPage />}
          {activeTab === 'actions' && <ActionTimeline />}
          {activeTab === 'calculator' && <PersonalCalculatorPage />}
        </main>
      </div>
    </div>
  );
};

