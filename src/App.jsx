import React, { useState, useEffect } from 'react';
import {
  Leaf, Zap, Users, Camera, ShieldCheck, PlayCircle, CheckCircle2,
  AlertTriangle, RefreshCw, Plus, Clock, Globe, ArrowUpRight,
  TrendingDown, Building2, HardDrive, Filter, Download, Eye, X,
  Check, AlertCircle, FileText, Lock, Sliders, ChevronRight, LogOut, User,
  Calculator, Activity
} from 'lucide-react';
import LoginPage from './components/LoginPage';
import DigitalTwin from './components/DigitalTwin';
import CameraStation from './components/camera-station/CameraStation';
import CarbonCalculator from './components/calculator/CarbonCalculator';
import RoomStatusInterface from './components/room-status/RoomStatusInterface';
import CampusCarbonTwinView from './components/campus-carbon-twin/CampusCarbonTwinView';
import LiveRoomsTwinPage from './components/live-twin/LiveRoomsTwinPage';
import './components/camera-station/CameraStation.css';
import './components/calculator/styles/calculator.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('carbontwin_user') || sessionStorage.getItem('carbontwin_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const getTabFromRoute = () => {
    if (typeof window === 'undefined') return 'overview';
    const p = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const route = p || h;
    if (route === 'twin' || route.startsWith('twin')) return 'twin';
    if (route === 'live' || route.startsWith('live')) return 'live';
    if (route === 'calculator') return 'calculator';
    if (route === 'facilities') return 'facilities';
    if (route === 'equipment') return 'equipment';
    if (route === 'observations') return 'observations';
    if (route === 'camera-station') return 'camera-station';
    if (route === 'room-status') return 'room-status';
    if (route === 'scenarios') return 'scenarios';
    if (route === 'actions') return 'actions';
    if (route === 'emission-factors') return 'emission-factors';
    if (route === 'database') return 'database';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromRoute);

  const navigateTo = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'overview' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  };

  const handleTabChange = navigateTo;

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromRoute());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);
  const [analytics, setAnalytics] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [observations, setObservations] = useState([]);
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [actions, setActions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [showNewScenarioModal, setShowNewScenarioModal] = useState(false);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);
  const [showActionConfirmModal, setShowActionConfirmModal] = useState(null);
  const [showSnapshotDetailModal, setShowSnapshotDetailModal] = useState(null);

  // New scenario form
  const [scenarioForm, setScenarioForm] = useState({
    room_id: '',
    policy_name: 'Automated Vacancy Power Down (15m Idle Timeout)',
    hours_saved_per_day: 5,
    emission_factor_id: ''
  });

  // Action completion form
  const [actionConfirmNote, setActionConfirmNote] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAna, resRooms, resEq, resObs, resEf, resScen, resAct, resUsers] = await Promise.all([
        fetch('/api/analytics').then(r => r.json()),
        fetch('/api/rooms').then(r => r.json()),
        fetch('/api/equipment').then(r => r.json()),
        fetch('/api/observations').then(r => r.json()),
        fetch('/api/emission-factors').then(r => r.json()),
        fetch('/api/scenarios').then(r => r.json()),
        fetch('/api/actions').then(r => r.json()),
        fetch('/api/users').then(r => r.json()).catch(() => [])
      ]);

      setAnalytics(resAna);
      setRooms(resRooms);
      setEquipment(resEq);
      setObservations(resObs);
      setEmissionFactors(resEf);
      setScenarios(resScen);
      setActions(resAct);
      setUsers(resUsers || []);

      if (!scenarioForm.room_id && resRooms.length > 0) {
        setScenarioForm(prev => ({
          ...prev,
          room_id: resRooms[0].id,
          emission_factor_id: resEf[1]?.id || resEf[0]?.id || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetch('/api/analytics').then(r => r.json()).then(setAnalytics).catch(() => {});
      fetch('/api/observations').then(r => r.json()).then(setObservations).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateTelemetry = async (roomId = null, targetPeople = null) => {
    try {
      const res = await fetch('/api/simulate-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, people_detected: targetPeople })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Telemetry updated: ${data.room.name} now detected with ${data.observation.people_detected} occupants.`);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleEquipmentState = async (eq) => {
    const nextState = eq.declared_state === 'ON' ? 'OFF' : eq.declared_state === 'OFF' ? 'UNKNOWN' : 'ON';
    try {
      const res = await fetch(`/api/equipment/${eq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declared_state: nextState })
      });
      if (res.ok) {
        showToast(`Updated ${eq.name} state to ${nextState}`);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateScenario = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenarioForm)
      });
      if (res.ok) {
        const created = await res.json();
        showToast(`Scenario created with frozen snapshot! (${created.result_snapshot_json.annual_avoided_emissions_t_co2e} tCO2e/yr avoided)`);
        setShowNewScenarioModal(false);
        fetchData();
        setActiveTab('scenarios');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePromoteScenarioToAction = async (scenarioId) => {
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenarioId,
          status: 'APPROVED',
          completion_note: 'Approved for facility implementation based on frozen scenario calculations.'
        })
      });
      if (res.ok) {
        showToast('Scenario promoted to APPROVED Action Plan item!');
        fetchData();
        setActiveTab('actions');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmActionComplete = async () => {
    if (!showActionConfirmModal) return;
    try {
      const res = await fetch(`/api/actions/${showActionConfirmModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          completion_note: actionConfirmNote || 'Human verification confirmed relay or setback completion.'
        })
      });
      if (res.ok) {
        showToast('Action marked COMPLETED with HUMAN_CONFIRMED verification.');
        setShowActionConfirmModal(null);
        setActionConfirmNote('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetData = async () => {
    if (confirm('Reset database to authentic institutional baseline?')) {
      await fetch('/api/reset-data', { method: 'POST' });
      await fetchData();
      showToast('Database reset to institutional baseline');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('carbontwin_user');
    localStorage.removeItem('carbontwin_token');
    sessionStorage.removeItem('carbontwin_user');
    setCurrentUser(null);
    showToast('Successfully logged out.');
  };

  // Filtered rooms
  const buildings = ['ALL', ...new Set(rooms.map(r => r.building_name))];
  const filteredRooms = selectedBuilding === 'ALL'
    ? rooms
    : rooms.filter(r => r.building_name === selectedBuilding);

  // Latest observation lookup
  const latestObsMap = {};
  observations.forEach(o => {
    if (!latestObsMap[o.room_id] || new Date(o.observed_at) > new Date(latestObsMap[o.room_id].observed_at)) {
      latestObsMap[o.room_id] = o;
    }
  });

  // If not authenticated, show Digital Twin directly if on /twin route, otherwise show Login
  if (!currentUser) {
    if (activeTab === 'twin') {
      return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
          {/* Header for Standalone Twin Guest View */}
          <div style={{
            background: '#061814',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #13382f',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Leaf size={16} color="#ffffff" />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>CARBON TWIN</span>
                <span style={{ fontSize: '0.7rem', color: '#6ee7b7', marginLeft: '0.5rem' }}>Decarbonization Intelligence</span>
              </div>
            </div>

            <button
              id="btn-return-login"
              onClick={() => handleTabChange('overview')}
              style={{
                background: '#0f3229',
                color: '#d1fae5',
                border: '1px solid #1a5646',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              Sign In to Enterprise Dashboard →
            </button>
          </div>

          <DigitalTwin onBackToDashboard={() => handleTabChange('overview')} />
        </div>
      );
    }

    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          showToast(`Welcome back, ${u.name}!`);
        }}
        onExploreTwin={() => handleTabChange('twin')}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          background: '#061814',
          color: '#ffffff',
          padding: '0.8rem 1.4rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          border: '1px solid #059669',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Carbon Twin Top Brand Header */}
      <header style={{
        backgroundColor: '#061814',
        borderBottom: '1px solid #13382f',
        color: '#ffffff',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Carbon Twin Logo Emblem */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
            }}>
              <Leaf size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                CARBON TWIN
                <span style={{ fontSize: '0.65rem', fontWeight: 600, background: '#13382f', color: '#10b981', padding: '0.1rem 0.45rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Enterprise
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 500 }}>
                Campus Energy & Decarbonization Intelligence
              </div>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', background: '#1a473b' }} />

          {/* Org Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#e2e8f0' }}>
            <Building2 size={16} color="#10b981" />
            <span style={{ fontWeight: 600 }}>St. Jude Research Campus</span>
            <span style={{ color: '#94a3b8' }}>• Scope 2 Facilities</span>
          </div>
        </div>

        {/* Right side stats & privacy guarantee badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Privacy badge */}
          <div style={{
            background: '#09231d',
            border: '1px solid #14493b',
            borderRadius: '6px',
            padding: '0.35rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#a7f3d0'
          }}>
            <ShieldCheck size={16} color="#10b981" />
            <span><strong>Privacy Verified:</strong> Zero Face Embeddings | Anonymous Headcounts</span>
          </div>

          {/* Quick simulation button */}
          <button
            onClick={() => handleSimulateTelemetry()}
            className="btn-secondary"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.775rem',
              background: '#0f3229',
              color: '#d1fae5',
              border: '1px solid #1a5646'
            }}
            title="Inject an edge camera telemetry update"
          >
            <PlayCircle size={14} color="#10b981" />
            Simulate Edge Telemetry
          </button>

          <button
            onClick={handleResetData}
            className="btn-secondary"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.775rem',
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid #1a473b'
            }}
          >
            <RefreshCw size={14} />
            Reset Data
          </button>

          {/* User Profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #1a473b', paddingLeft: '0.85rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#0a261f',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #15513f'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#ffffff'
              }}>
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>
                  {currentUser?.name || 'Authorized User'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#6ee7b7' }}>
                  {currentUser?.role || 'Staff'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                background: '#1f1315',
                color: '#fca5a5',
                border: '1px solid #5c1d24',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="Sign out of Carbon Twin"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Carbon Twin Navigation Tabs */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto'
      }}>
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => navigateTo('overview')}
        >
          <Leaf size={16} />
          Executive Carbon Overview
        </button>

        <button
          className={`tab-btn ${activeTab === 'facilities' ? 'active' : ''}`}
          onClick={() => navigateTo('facilities')}
        >
          <Building2 size={16} />
          Facilities & Digital Twin
          <span className="pill pill-slate" style={{ fontSize: '0.7rem' }}>{rooms.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => navigateTo('equipment')}
        >
          <HardDrive size={16} />
          Equipment & Load Inventory
          <span className="pill pill-slate" style={{ fontSize: '0.7rem' }}>{equipment.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'observations' ? 'active' : ''}`}
          onClick={() => navigateTo('observations')}
        >
          <Camera size={16} />
          Vision Observations
          <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>Live</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'camera-station' ? 'active' : ''}`}
          onClick={() => navigateTo('camera-station')}
        >
          <Camera size={16} />
          Camera Station
          <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>Edge AI</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'room-status' ? 'active' : ''}`}
          onClick={() => navigateTo('room-status')}
        >
          <Building2 size={16} />
          Room Status
          <span className="pill pill-slate" style={{ fontSize: '0.7rem' }}>Station</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => navigateTo('calculator')}
        >
          <Calculator size={16} />
          Carbon Calculator
          <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>ISO 14064</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'twin' ? 'active' : ''}`}
          onClick={() => navigateTo('twin')}
        >
          <Leaf size={16} />
          Twin
          <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>2D Twin</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => navigateTo('live')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <span
            className="animate-pulse-live"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block',
              boxShadow: '0 0 6px #10b981'
            }}
          />
          Live
          <span className="pill pill-indigo" style={{ fontSize: '0.7rem' }}>Rooms Model</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'scenarios' ? 'active' : ''}`}
          onClick={() => navigateTo('scenarios')}
        >
          <Sliders size={16} />
          Scenario Modeler
          <span className="pill pill-slate" style={{ fontSize: '0.7rem' }}>{scenarios.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => navigateTo('actions')}
        >
          <CheckCircle2 size={16} />
          Climate Action Plan
          <span className="pill pill-indigo" style={{ fontSize: '0.7rem' }}>{actions.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'emission-factors' ? 'active' : ''}`}
          onClick={() => navigateTo('emission-factors')}
        >
          <Globe size={16} />
          Emission Factors
          <span className="pill pill-slate" style={{ fontSize: '0.7rem' }}>{emissionFactors.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => navigateTo('database')}
        >
          <FileText size={16} />
          Carbon Database
          <span className="pill pill-slate" style={{ fontSize: '0.7rem' }}>7 Tables</span>
        </button>
      </nav>

      {/* Main Body Content */}
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* Loading Spinner */}
        {loading && !analytics && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
            <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
            <p>Loading Carbon Twin Energy & Carbon Data...</p>
          </div>
        )}

        {/* TAB 1: EXECUTIVE CARBON OVERVIEW */}
        {activeTab === 'overview' && analytics && (
          <div>
            {/* Net-Zero Target Progress Bar */}
            <div className="carbon-dark-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, letterSpacing: '0.05em' }}>
                    2030 Campus Decarbonization Mandate
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                    Net-Zero Trajectory: 42.4% Emissions Reduction Achieved
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Grid Factor in Use:</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#a7f3d0' }}>
                    {analytics.default_emission_factor?.name} ({analytics.default_emission_factor?.value} kgCO₂e/kWh)
                  </div>
                </div>
              </div>

              {/* Progress track */}
              <div style={{ width: '100%', height: '8px', background: '#13382f', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '42.4%', height: '100%', background: 'linear-gradient(90deg, #059669, #34d399)', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Inefficiency Alert Banner (if empty rooms have active power) */}
            {analytics.unoccupied_waste_rooms_count > 0 && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={20} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>
                      Carbon Inefficiency Alert: {analytics.unoccupied_waste_rooms_count} Unoccupied Rooms With Active Non-Essential Load
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#b45309' }}>
                      Currently dissipating <strong>{analytics.wasted_power_kw} kW</strong> into empty spaces. Potential to avoid <strong>{analytics.avoidable_hourly_emissions_kg_co2e} kg CO₂e / hour</strong> immediately.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewScenarioModal(true)}
                  className="btn-primary"
                  style={{ background: '#d97706', borderColor: '#b45309', padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                >
                  <Sliders size={14} />
                  Model Abatement Scenario
                </button>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="carbon-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>LIVE POWER DRAW</span>
                  <div style={{ padding: '0.35rem', background: '#ecfdf5', borderRadius: '6px' }}>
                    <Zap size={16} color="#059669" />
                  </div>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }} className="tabular-nums">
                  {analytics.total_active_power_kw} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>kW</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                  <span className="animate-pulse-live" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                  Live campus edge load
                </div>
              </div>

              <div className="carbon-card" style={{ padding: '1.25rem', borderColor: analytics.wasted_power_kw > 0 ? '#fde68a' : '#e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>WASTED POWER (EMPTY ROOMS)</span>
                  <div style={{ padding: '0.35rem', background: '#fffbeb', borderRadius: '6px' }}>
                    <TrendingDown size={16} color="#d97706" />
                  </div>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: analytics.wasted_power_kw > 0 ? '#b45309' : '#0f172a' }} className="tabular-nums">
                  {analytics.wasted_power_kw} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>kW</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.35rem' }}>
                  {analytics.unoccupied_waste_rooms_count} rooms empty with power ON
                </div>
              </div>

              <div className="carbon-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>CURRENT HOURLY EMISSIONS</span>
                  <div style={{ padding: '0.35rem', background: '#ecfdf5', borderRadius: '6px' }}>
                    <Leaf size={16} color="#059669" />
                  </div>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }} className="tabular-nums">
                  {analytics.current_hourly_emissions_kg_co2e} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>kg CO₂e/hr</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Scope 2 Grid Electricity
                </div>
              </div>

              <div className="carbon-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>POTENTIAL ANNUAL ABATEMENT</span>
                  <div style={{ padding: '0.35rem', background: '#eef2ff', borderRadius: '6px' }}>
                    <ArrowUpRight size={16} color="#4f46e5" />
                  </div>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4f46e5' }} className="tabular-nums">
                  {analytics.potential_annual_avoidable_tonnes_co2e} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>tCO₂e / yr</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4f46e5', marginTop: '0.35rem' }}>
                  Available via Smart Idle Policies
                </div>
              </div>
            </div>

            {/* Interactive Energy & Occupancy Timeline (SVG Visualizer) */}
            <div className="carbon-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    24-Hour Energy vs. Occupancy Correlation & Waste Detection
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Comparing campus active wattage against aggregate room headcounts to identify off-hours leakage.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }} />
                    <span>Occupied Productive Power (kW)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }} />
                    <span>Wasted Vacancy Power (kW)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '12px', height: '3px', background: '#6366f1' }} />
                    <span>Total People Detected</span>
                  </div>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                <svg viewBox="0 0 800 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="780" y2="20" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="40" y1="60" x2="780" y2="60" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="40" y1="100" x2="780" y2="100" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="40" y1="140" x2="780" y2="140" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="40" y1="180" x2="780" y2="180" stroke="#e2e8f0" />

                  {/* Y-axis labels */}
                  <text x="32" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">40 kW</text>
                  <text x="32" y="104" fontSize="10" fill="#94a3b8" textAnchor="end">20 kW</text>
                  <text x="32" y="184" fontSize="10" fill="#94a3b8" textAnchor="end">0 kW</text>

                  {/* Bar data for 12 two-hour blocks */}
                  {[
                    { hour: '00:00', prod: 4, waste: 8, people: 0 },
                    { hour: '02:00', prod: 4, waste: 7, people: 0 },
                    { hour: '04:00', prod: 4, waste: 7, people: 0 },
                    { hour: '06:00', prod: 8, waste: 5, people: 4 },
                    { hour: '08:00', prod: 20, waste: 4, people: 42 },
                    { hour: '10:00', prod: 26, waste: 3, people: 78 },
                    { hour: '12:00', prod: 18, waste: 9, people: 30 }, // Lunch break waste spike!
                    { hour: '14:00', prod: 27, waste: 3, people: 85 },
                    { hour: '16:00', prod: 22, waste: 4, people: 60 },
                    { hour: '18:00', prod: 12, waste: 8, people: 15 },
                    { hour: '20:00', prod: 6, waste: 10, people: 2 },  // Evening waste spike
                    { hour: '22:00', prod: 4, waste: 9, people: 0 }
                  ].map((d, idx) => {
                    const x = 70 + idx * 58;
                    const prodHeight = (d.prod / 40) * 160;
                    const wasteHeight = (d.waste / 40) * 160;
                    const prodY = 180 - prodHeight;
                    const wasteY = prodY - wasteHeight;

                    return (
                      <g key={idx}>
                        {/* Productive Bar */}
                        <rect x={x - 14} y={prodY} width="28" height={prodHeight} fill="#10b981" rx="2" />
                        {/* Wasted Bar */}
                        <rect x={x - 14} y={wasteY} width="28" height={wasteHeight} fill="#f59e0b" rx="2" opacity="0.9" />
                        {/* Hour Label */}
                        <text x={x} y="196" fontSize="10" fill="#64748b" textAnchor="middle">{d.hour}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Room Summary Quick Table */}
            <div className="carbon-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Live Facility Energy & Occupancy Telemetry
                </h3>
                <button
                  onClick={() => setActiveTab('facilities')}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                >
                  View All Rooms <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="carbon-table">
                  <thead>
                    <tr>
                      <th>Room & Building</th>
                      <th>Occupancy Headcount</th>
                      <th>Active Load</th>
                      <th>Non-Essential Load</th>
                      <th>Efficiency Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.room_metrics.map(rm => (
                      <tr key={rm.room_id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{rm.room_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rm.building_name}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Users size={14} color="#64748b" />
                            <span style={{ fontWeight: 600 }}>{rm.current_headcount}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ {rm.capacity}</span>
                          </div>
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: 600 }}>
                          {(rm.active_power_w / 1000).toFixed(2)} kW
                        </td>
                        <td className="tabular-nums" style={{ color: rm.nonessential_active_w > 0 ? '#b45309' : '#64748b' }}>
                          {(rm.nonessential_active_w / 1000).toFixed(2)} kW
                        </td>
                        <td>
                          {rm.is_wasting_energy ? (
                            <span className="pill pill-amber">
                              <AlertTriangle size={12} /> Empty with Active Load
                            </span>
                          ) : rm.current_headcount > 0 ? (
                            <span className="pill pill-emerald">
                              <CheckCircle2 size={12} /> Active & Occupied
                            </span>
                          ) : (
                            <span className="pill pill-slate">
                              Standby / De-energized
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleSimulateTelemetry(rm.room_id, rm.current_headcount === 0 ? 12 : 0)}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            title="Simulate occupants entering or leaving"
                          >
                            Toggle Occupancy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Campus Carbon Activity Calculator Section on Main Page */}
            <div style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Calculator size={22} color="#059669" />
                    Campus Activity Carbon Calculator
                    <span className="pill pill-emerald" style={{ fontSize: '0.75rem' }}>ISO 14064 Verified</span>
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                    Independent emissions calculation engine for campus electricity, equipment loads, and commuter transport.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('calculator')}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowUpRight size={14} /> Full Screen Calculator Mode
                </button>
              </div>

              {/* Embedded Carbon Calculator */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                <CarbonCalculator />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FACILITIES & DIGITAL TWIN */}
        {activeTab === 'facilities' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Facilities & Spatial Intelligence</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Manage rooms, monitor privacy-preserving camera headcounts, and inspect active equipment wattage.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Building filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.35rem 0.65rem', fontSize: '0.825rem' }}>
                  <Filter size={14} color="#64748b" />
                  <span style={{ color: '#64748b' }}>Building:</span>
                  <select
                    value={selectedBuilding}
                    onChange={e => setSelectedBuilding(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, color: '#1e293b' }}
                  >
                    {buildings.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowNewRoomModal(true)}
                  className="btn-primary"
                  style={{ fontSize: '0.825rem' }}
                >
                  <Plus size={16} /> Add Room
                </button>
              </div>
            </div>

            {/* Room Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {filteredRooms.map(room => {
                const roomEq = equipment.filter(e => e.room_id === room.id);
                const latestObs = latestObsMap[room.id] || { people_detected: 0, coverage: 0.95, source: 'Sensor' };
                const isUnoccupied = latestObs.people_detected === 0;

                const activeWatts = roomEq.filter(e => e.declared_state === 'ON').reduce((s, e) => s + (e.rated_power_w * e.quantity), 0);
                const nonessentialActiveWatts = roomEq.filter(e => e.declared_state === 'ON' && e.nonessential && !e.safety_exclusion).reduce((s, e) => s + (e.rated_power_w * e.quantity), 0);
                const isWasting = isUnoccupied && nonessentialActiveWatts > 0;

                return (
                  <div key={room.id} className="carbon-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>
                            {room.building_name}
                          </div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                            {room.name}
                          </h3>
                        </div>
                      </div>

                      {/* Headcount Gauge & Inefficiency Status */}
                      <div style={{
                        background: isWasting ? '#fffbeb' : '#f8fafc',
                        border: `1px solid ${isWasting ? '#fde68a' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        padding: '0.75rem',
                        margin: '0.75rem 0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Occupancy (Headcount)</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                            {latestObs.people_detected} / {room.capacity}
                          </span>
                        </div>
                        {/* Capacity bar */}
                        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, (latestObs.people_detected / room.capacity) * 100)}%`,
                            height: '100%',
                            background: latestObs.people_detected > 0 ? '#10b981' : '#cbd5e1'
                          }} />
                        </div>

                        {/* Status message */}
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {isWasting ? (
                            <span style={{ color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <AlertTriangle size={14} /> Waste: Empty room, {nonessentialActiveWatts}W running
                            </span>
                          ) : isUnoccupied ? (
                            <span style={{ color: '#64748b' }}>Room empty, equipment standby</span>
                          ) : (
                            <span style={{ color: '#059669', fontWeight: 600 }}>Active occupied state</span>
                          )}
                        </div>
                      </div>

                      {/* Power metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Active Power</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700 }} className="tabular-nums">
                            {(activeWatts / 1000).toFixed(2)} kW
                          </div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Equipment Count</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                            {roomEq.length} devices
                          </div>
                        </div>
                      </div>

                      {/* Camera source info */}
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Camera size={12} />
                        <span>Source: {latestObs.source || 'Optical Sensor'}</span>
                        <span>• Coverage: {Math.round((latestObs.coverage || 0.95) * 100)}%</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <button
                        onClick={() => handleSimulateTelemetry(room.id, isUnoccupied ? Math.floor(room.capacity * 0.4) : 0)}
                        className="btn-secondary"
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}
                      >
                        {isUnoccupied ? 'Set Occupied' : 'Set Vacant'}
                      </button>

                      <button
                        onClick={() => {
                          setScenarioForm(prev => ({ ...prev, room_id: room.id }));
                          setShowNewScenarioModal(true);
                        }}
                        className="btn-primary"
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}
                      >
                        Model Scenario
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: EQUIPMENT & LOAD INVENTORY */}
        {activeTab === 'equipment' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Equipment & Load Management</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Track rated power (W), declared operating states, safety exclusion shields, and non-essential flags.
                </p>
              </div>

              <button
                onClick={() => setShowNewEquipmentModal(true)}
                className="btn-primary"
                style={{ fontSize: '0.825rem' }}
              >
                <Plus size={16} /> Add Equipment
              </button>
            </div>

            {/* Equipment Table */}
            <div className="carbon-card" style={{ overflowX: 'auto' }}>
              <table className="carbon-table">
                <thead>
                  <tr>
                    <th>Equipment Name</th>
                    <th>Room Assignment</th>
                    <th>Qty</th>
                    <th>Rated Power (W)</th>
                    <th>Total Controllable</th>
                    <th>Declared State</th>
                    <th>Classification</th>
                    <th>Safety Exclusion</th>
                    <th>Quick Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map(eq => {
                    const room = rooms.find(r => r.id === eq.room_id);
                    const totalWatts = eq.rated_power_w * eq.quantity;

                    return (
                      <tr key={eq.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{eq.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {eq.id}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{room?.name || eq.room_id}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{room?.building_name}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{eq.quantity}</td>
                        <td className="tabular-nums">{eq.rated_power_w} W</td>
                        <td className="tabular-nums" style={{ fontWeight: 700 }}>
                          {(totalWatts / 1000).toFixed(2)} kW
                        </td>
                        <td>
                          {eq.declared_state === 'ON' && (
                            <span className="pill pill-emerald"><Zap size={12} /> ON</span>
                          )}
                          {eq.declared_state === 'OFF' && (
                            <span className="pill pill-slate">OFF</span>
                          )}
                          {eq.declared_state === 'UNKNOWN' && (
                            <span className="pill pill-amber">UNKNOWN</span>
                          )}
                        </td>
                        <td>
                          {eq.nonessential ? (
                            <span className="pill pill-indigo">Non-Essential</span>
                          ) : (
                            <span className="pill pill-slate">Essential Base</span>
                          )}
                        </td>
                        <td>
                          {eq.safety_exclusion ? (
                            <span className="pill pill-rose" title="Critical safety or biological cold-chain asset. Automated power-down strictly prohibited.">
                              <Lock size={12} /> Protected Exclusion
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Standard Control</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleEquipmentState(eq)}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            Toggle State
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: VISION OBSERVATIONS (PRIVACY-PRESERVING TELEMETRY) */}
        {activeTab === 'observations' && (
          <div>
            {/* Privacy Compliance Banner */}
            <div style={{
              background: '#061814',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              border: '1px solid #13382f',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <div style={{ padding: '0.5rem', background: '#092e24', borderRadius: '8px' }}>
                <ShieldCheck size={28} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700 }}>
                  Privacy & Data Governance Compliance Certification
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.2rem 0 0.4rem' }}>
                  Strict Privacy-Preserving Vision Telemetry
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  In accordance with FERPA, GDPR, and institutional privacy charters:
                  <strong> No student names, health records, face embeddings, or continuous location histories</strong> are ever captured or stored.
                  All edge inference generates only ephemeral aggregate integer headcounts (people_detected).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Live Edge Vision Observations Stream
              </h3>
              <button
                onClick={() => handleSimulateTelemetry()}
                className="btn-primary"
                style={{ fontSize: '0.8rem' }}
              >
                <Camera size={14} /> Send Test Observation Packet
              </button>
            </div>

            <div className="carbon-card" style={{ overflowX: 'auto' }}>
              <table className="carbon-table">
                <thead>
                  <tr>
                    <th>Observation ID</th>
                    <th>Target Room</th>
                    <th>Camera Session ID</th>
                    <th>People Detected</th>
                    <th>Observed At</th>
                    <th>Received At</th>
                    <th>Sensor Coverage</th>
                    <th>Hardware Source</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map(obs => {
                    const room = rooms.find(r => r.id === obs.room_id);
                    return (
                      <tr key={obs.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>
                          {obs.id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{room?.name || obs.room_id}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{room?.building_name}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569' }}>
                          {obs.camera_session_id}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Users size={14} color="#059669" />
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }} className="tabular-nums">
                              {obs.people_detected}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>heads</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#475569' }}>
                          {new Date(obs.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {new Date(obs.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td>
                          <span className="pill pill-emerald">
                            {Math.round((obs.coverage || 0.95) * 100)}%
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {obs.source}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SCENARIOS (SNAPSHOT FREEZE ENGINE) */}
        {activeTab === 'scenarios' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                  Decarbonization Scenario Modeler
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Simulate energy abatement policies with <strong>Snapshot Freeze Guarantee</strong>: equipment ratings and factors are permanently locked at scenario creation.
                </p>
              </div>

              <button
                onClick={() => setShowNewScenarioModal(true)}
                className="btn-primary"
                style={{ fontSize: '0.825rem' }}
              >
                <Plus size={16} /> New Scenario Simulation
              </button>
            </div>

            {/* Freeze Guarantee Explanation Box */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.825rem',
              color: '#166534'
            }}>
              <Lock size={18} color="#16a34a" />
              <div>
                <strong>Audit Compliance Guarantee:</strong> Equipment power ratings and emission factor values are frozen inside <code>input_snapshot_json</code>.
                Editing an equipment wattage or grid factor tomorrow will never retroactively modify the recorded savings of past scenarios.
              </div>
            </div>

            {/* Scenarios Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem' }}>
              {scenarios.map(scen => {
                const room = rooms.find(r => r.id === scen.room_id);
                const inputSnap = scen.input_snapshot_json || {};
                const resSnap = scen.result_snapshot_json || {};
                const linkedAction = actions.find(a => a.scenario_id === scen.id);

                return (
                  <div key={scen.id} className="carbon-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                            {inputSnap.building_name || room?.building_name}
                          </span>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                            {inputSnap.room_name || room?.name}
                          </h3>
                        </div>
                        <span className="pill pill-slate" style={{ fontSize: '0.7rem' }}>
                          {new Date(scen.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>
                        Policy: {inputSnap.policy_name}
                      </div>

                      {/* Avoided Emissions Hero Card */}
                      <div style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '0.85rem',
                        marginBottom: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>
                              Avoided Carbon Emissions
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46' }} className="tabular-nums">
                              {resSnap.annual_avoided_emissions_t_co2e} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>tCO₂e / yr</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                              ({resSnap.annual_avoided_emissions_kg_co2e} kg CO₂e)
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>
                              Energy & Financial
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065f46' }}>
                              ${resSnap.estimated_annual_cost_savings_usd?.toLocaleString()} <span style={{ fontSize: '0.75rem' }}>/yr</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                              {resSnap.annual_kwh_avoided?.toLocaleString()} kWh avoided
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Snapshot Highlights */}
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.6rem', borderRadius: '6px' }}>
                        <div><strong>Controllable Load Frozen:</strong> {inputSnap.total_controllable_power_w} W ({inputSnap.equipment_snapshot?.length || 0} items)</div>
                        <div><strong>Factor Frozen:</strong> {inputSnap.emission_factor_used?.name} ({inputSnap.emission_factor_used?.value} {inputSnap.emission_factor_used?.unit})</div>
                      </div>
                    </div>

                    {/* Bottom controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <button
                        onClick={() => setShowSnapshotDetailModal(scen)}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      >
                        <Eye size={14} /> View Snapshot JSON
                      </button>

                      {linkedAction ? (
                        <span className={`pill ${linkedAction.status === 'COMPLETED' ? 'pill-emerald' : 'pill-amber'}`}>
                          Action {linkedAction.status}
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePromoteScenarioToAction(scen.id)}
                          className="btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        >
                          <CheckCircle2 size={14} /> Promote to Action Plan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: CLIMATE ACTION PLAN */}
        {activeTab === 'actions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                  Climate Action Plan & Execution Tracker
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Formal decarbonization projects with <strong>HUMAN_CONFIRMED</strong> completion verification and audit notes.
                </p>
              </div>
            </div>

            <div className="carbon-card" style={{ overflowX: 'auto' }}>
              <table className="carbon-table">
                <thead>
                  <tr>
                    <th>Action ID</th>
                    <th>Linked Scenario</th>
                    <th>Facility & Policy</th>
                    <th>Status</th>
                    <th>Approved At</th>
                    <th>Completed At</th>
                    <th>Completion Method</th>
                    <th>Engineer Verification Note</th>
                    <th>Sign-off</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map(act => {
                    const scen = scenarios.find(s => s.id === act.scenario_id);
                    const room = rooms.find(r => r.id === scen?.room_id);

                    return (
                      <tr key={act.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>
                          {act.id}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569' }}>
                          {act.scenario_id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{room?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{scen?.input_snapshot_json?.policy_name}</div>
                        </td>
                        <td>
                          {act.status === 'APPROVED' && (
                            <span className="pill pill-amber">APPROVED</span>
                          )}
                          {act.status === 'COMPLETED' && (
                            <span className="pill pill-emerald"><Check size={12} /> COMPLETED</span>
                          )}
                          {act.status === 'CANCELLED' && (
                            <span className="pill pill-rose">CANCELLED</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#475569' }}>
                          {act.approved_at ? new Date(act.approved_at).toLocaleString() : '—'}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#475569' }}>
                          {act.completed_at ? new Date(act.completed_at).toLocaleString() : 'In Progress'}
                        </td>
                        <td>
                          <span className="pill pill-slate" style={{ fontSize: '0.7rem' }}>
                            {act.completion_method}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#334155', maxWidth: '300px' }}>
                          {act.completion_note}
                        </td>
                        <td>
                          {act.status === 'APPROVED' && (
                            <button
                              onClick={() => {
                                setShowActionConfirmModal(act);
                                setActionConfirmNote('Facility engineer verified automated vacancy setback operational.');
                              }}
                              className="btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            >
                              Human Sign-off
                            </button>
                          )}
                          {act.status === 'COMPLETED' && (
                            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle2 size={14} /> Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: EMISSION FACTORS */}
        {activeTab === 'emission-factors' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Emission Factors Library</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Regional GHG emission intensities from EPA eGRID, UK DEFRA, and IEA for Scope 2 electricity accounting.
                </p>
              </div>
            </div>

            <div className="carbon-card" style={{ overflowX: 'auto' }}>
              <table className="carbon-table">
                <thead>
                  <tr>
                    <th>Factor Name</th>
                    <th>Emissions Value</th>
                    <th>Unit</th>
                    <th>Gas Basis</th>
                    <th>Geography</th>
                    <th>Reporting Year</th>
                    <th>Source Reference</th>
                    <th>Factor Type</th>
                  </tr>
                </thead>
                <tbody>
                  {emissionFactors.map(ef => (
                    <tr key={ef.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ef.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {ef.id}</div>
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 700, fontSize: '1rem', color: '#059669' }}>
                        {ef.value}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>{ef.unit}</td>
                      <td>
                        <span className="pill pill-slate">{ef.gas_basis}</span>
                      </td>
                      <td>{ef.geography}</td>
                      <td>{ef.reporting_year}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{ef.source_reference}</td>
                      <td>
                        <span className="pill pill-emerald">{ef.factor_type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: CARBON DATABASE EXPLORER */}
        {activeTab === 'database' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Carbon Database Model & Table Inspector</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Custom institutional database backed by <code>data/carbon_database.json</code> with 7 core tables: <code>rooms</code>, <code>equipment</code>, <code>observations</code>, <code>emission_factors</code>, <code>scenarios</code>, <code>actions</code>, <code>users</code>.
                </p>
              </div>
            </div>

            {/* Quick table cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {[
                { title: 'rooms', count: rooms.length, desc: 'id, building_name, name, capacity, created_at', data: rooms },
                { title: 'equipment', count: equipment.length, desc: 'id, room_id, name, quantity, rated_power_w, declared_state, state_declared_at, nonessential, safety_exclusion', data: equipment },
                { title: 'observations', count: observations.length, desc: 'id, room_id, camera_session_id, people_detected, observed_at, received_at, coverage, source', data: observations },
                { title: 'emission_factors', count: emissionFactors.length, desc: 'id, name, value, unit, geography, reporting_year, source_reference, gas_basis, factor_type', data: emissionFactors },
                { title: 'scenarios', count: scenarios.length, desc: 'id, room_id, created_at, input_snapshot_json, result_snapshot_json', data: scenarios },
                { title: 'actions', count: actions.length, desc: 'id, scenario_id, status, approved_at, completed_at, completion_method, completion_note', data: actions },
                { title: 'users', count: users.length, desc: 'id, name, email, role, department, badge, created_at', data: users }
              ].map(table => (
                <div key={table.title} className="carbon-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={18} color="#059669" />
                      <h4 style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'monospace' }}>{table.title}</h4>
                    </div>
                    <span className="pill pill-slate">{table.count} rows</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    {table.desc}
                  </p>
                  <pre style={{
                    background: '#061814',
                    color: '#86efac',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    maxHeight: '140px',
                    overflowY: 'auto'
                  }}>
                    {JSON.stringify(table.data.slice(0, 2), null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CAMPUS ENERGY DIGITAL TWIN */}
        {activeTab === 'twin' && (
          <DigitalTwin onBackToDashboard={() => handleTabChange('overview')} />
        )}

        {/* TAB: CAMERA STATION (SECONDARY STATION INTEGRATION) */}
        {activeTab === 'camera-station' && (
          <div>
            <CameraStation
              initialRoomId={rooms[0]?.id || 'ROOM-LIB-100'}
              onLocalObservation={(roomId, count, timestamp) => {
                setObservations(prev => [
                  {
                    id: `obs-cam-${Date.now().toString().slice(-4)}`,
                    room_id: roomId,
                    camera_session_id: 'cam-sess-edge-local',
                    people_detected: count,
                    observed_at: timestamp,
                    received_at: new Date().toISOString(),
                    coverage: 0.98,
                    source: 'Edge Browser Camera (Local AI)'
                  },
                  ...prev.slice(0, 49)
                ]);
                fetch('/api/analytics').then(r => r.json()).then(setAnalytics).catch(() => {});
              }}
            />
          </div>
        )}

        {/* TAB: ROOM STATUS INTERFACE (SECONDARY STATION INTEGRATION) */}
        {activeTab === 'room-status' && (
          <div>
            <RoomStatusInterface
              rooms={rooms}
              equipment={equipment}
              observations={observations}
              analytics={analytics}
            />
          </div>
        )}

        {/* TAB: CARBON CALCULATOR FULL VIEW */}
        {activeTab === 'calculator' && (
          <div>
            <CarbonCalculator />
          </div>
        )}

        {/* TAB: CAMPUS CARBON TWIN (/twin) */}
        {activeTab === 'twin' && (
          <div>
            <CampusCarbonTwinView
              onSyncObservation={(roomId, count, timestamp) => {
                setObservations(prev => [
                  {
                    id: `obs-twin-${Date.now().toString().slice(-4)}`,
                    room_id: roomId,
                    camera_session_id: 'cam-sess-edge-local',
                    people_detected: count,
                    observed_at: timestamp,
                    received_at: new Date().toISOString(),
                    coverage: 0.98,
                    source: 'Campus Carbon Twin (Local AI)'
                  },
                  ...prev.slice(0, 49)
                ]);
                fetch('/api/analytics').then(r => r.json()).then(setAnalytics).catch(() => {});
              }}
            />
          </div>
        )}

        {/* TAB: LIVE ROOMS TWIN MODEL (/live) */}
        {activeTab === 'live' && (
          <div>
            <LiveRoomsTwinPage />
          </div>
        )}
      </main>

      {/* MODAL 1: NEW SCENARIO SIMULATION */}
      {showNewScenarioModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={20} color="#059669" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Model Abatement Scenario</h3>
              </div>
              <button onClick={() => setShowNewScenarioModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleCreateScenario}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Select Target Facility Room
                </label>
                <select
                  value={scenarioForm.room_id}
                  onChange={e => setScenarioForm({ ...scenarioForm, room_id: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.building_name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Decarbonization Policy Name
                </label>
                <input
                  type="text"
                  value={scenarioForm.policy_name}
                  onChange={e => setScenarioForm({ ...scenarioForm, policy_name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Hours of Idle Run-Time Saved / Day: <strong>{scenarioForm.hours_saved_per_day} hrs</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={scenarioForm.hours_saved_per_day}
                  onChange={e => setScenarioForm({ ...scenarioForm, hours_saved_per_day: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Emission Factor Model
                </label>
                <select
                  value={scenarioForm.emission_factor_id}
                  onChange={e => setScenarioForm({ ...scenarioForm, emission_factor_id: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                >
                  {emissionFactors.map(ef => (
                    <option key={ef.id} value={ef.id}>
                      {ef.name} ({ef.value} {ef.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.75rem',
                color: '#475569',
                marginBottom: '1.25rem'
              }}>
                <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                <strong>Freeze Snapshot:</strong> When created, equipment ratings and this emission factor will be permanently stored in <code>input_snapshot_json</code>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewScenarioModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Run Simulation & Freeze Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD ROOM */}
      {showNewRoomModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Add New Facility Room</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  building_name: formData.get('building_name'),
                  name: formData.get('name'),
                  capacity: Number(formData.get('capacity')),
                  demo_room: false
                })
              });
              setShowNewRoomModal(false);
              showToast('Room created successfully');
              fetchData();
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Building Name</label>
                <input name="building_name" defaultValue="Curie Science Complex" required style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Room Name</label>
                <input name="name" placeholder="e.g. Nanotechnology Cleanroom 4A" required style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Capacity</label>
                <input name="capacity" type="number" defaultValue="30" required style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowNewRoomModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EQUIPMENT */}
      {showNewEquipmentModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Register New Equipment Asset</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              await fetch('/api/equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  room_id: formData.get('room_id'),
                  name: formData.get('name'),
                  quantity: Number(formData.get('quantity')),
                  rated_power_w: Number(formData.get('rated_power_w')),
                  declared_state: formData.get('declared_state'),
                  nonessential: formData.get('nonessential') === 'on',
                  safety_exclusion: formData.get('safety_exclusion') === 'on'
                })
              });
              setShowNewEquipmentModal(false);
              showToast('Equipment registered successfully');
              fetchData();
            }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Assign to Room</label>
                <select name="room_id" required style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.building_name})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Equipment Name</label>
                <input name="name" placeholder="e.g. 4K Dual Studio Monitors" required style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Quantity</label>
                  <input name="quantity" type="number" defaultValue="1" min="1" required style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Rated Watts (each)</label>
                  <input name="rated_power_w" type="number" defaultValue="250" min="0" required style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Initial Declared State</label>
                <select name="declared_state" style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </select>
              </div>
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="nonessential" id="nonessential" defaultChecked />
                <label htmlFor="nonessential" style={{ fontSize: '0.85rem' }}>Mark Non-Essential (Eligible for idle power-down)</label>
              </div>
              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="safety_exclusion" id="safety_exclusion" />
                <label htmlFor="safety_exclusion" style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600 }}>Safety Exclusion (Never auto-power down)</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowNewEquipmentModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Equipment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: HUMAN CONFIRMATION SIGN-OFF FOR ACTION */}
      {showActionConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={22} color="#059669" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Human Confirmation Sign-off</h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>
              Action ID: <code>{showActionConfirmModal.id}</code><br />
              Requirement: Method must be <strong>HUMAN_CONFIRMED</strong> with a signed completion note.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Completion Verification Note
              </label>
              <textarea
                value={actionConfirmNote}
                onChange={e => setActionConfirmNote(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                placeholder="e.g. Electrical engineer confirmed relay installation and 0W idle standby."
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowActionConfirmModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleConfirmActionComplete} className="btn-primary">
                Verify & Mark COMPLETED
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SNAPSHOT JSON INSPECTOR */}
      {showSnapshotDetailModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Frozen Snapshot Verification</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scenario ID: {showSnapshotDetailModal.id}</span>
              </div>
              <button onClick={() => setShowSnapshotDetailModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', marginBottom: '0.25rem' }}>
                  input_snapshot_json (Frozen Equipment & Factor Ratings)
                </h4>
                <pre style={{ background: '#061814', color: '#86efac', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto' }}>
                  {JSON.stringify(showSnapshotDetailModal.input_snapshot_json, null, 2)}
                </pre>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', marginBottom: '0.25rem' }}>
                  result_snapshot_json (Calculated Abatement Savings)
                </h4>
                <pre style={{ background: '#061814', color: '#86efac', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto' }}>
                  {JSON.stringify(showSnapshotDetailModal.result_snapshot_json, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => setShowSnapshotDetailModal(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

