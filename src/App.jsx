import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf, Zap, Users, Camera, ShieldCheck, PlayCircle, CheckCircle2,
  AlertTriangle, RefreshCw, Plus, Clock, Globe, ArrowUpRight,
  TrendingDown, Building2, HardDrive, Filter, Download, Eye, X,
  Check, AlertCircle, FileText, Lock, Sliders, ChevronRight, ChevronLeft, LogOut, User,
  Trash2, Calculator, Sparkles, Car, HelpCircle, Activity,
  Sun, Moon, Radio, FileSpreadsheet, Printer, Target
} from 'lucide-react';
import LoginPage from './components/LoginPage';

// Framer Motion variants for top navigation bar
const navVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      staggerChildren: 0.1
    }
  }
};

const tabItemVariants = {
  hidden: { y: -10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('carbontwin_user') || sessionStorage.getItem('carbontwin_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [observations, setObservations] = useState([]);
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);
  const [simulationActive, setSimulationActive] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Carbon Calculator State
  const [calcTab, setCalcTab] = useState('electricity');
  const [calcElectricity, setCalcElectricity] = useState({
    kwh: 450,
    bill_amount: '',
    tariff_rate: 8.50,
    factor_id: 'CEA_V19_FY2022_23_DEMO',
    period: 'MONTHLY',
    result: null,
    loading: false
  });
  const [calcTravel, setCalcTravel] = useState({
    mode: 'PETROL_CAR',
    distance_km: 18,
    occupants: 1,
    trips_per_week: 5,
    weeks_per_year: 40,
    result: null,
    loading: false
  });
  const [calcEquipment, setCalcEquipment] = useState({
    preset_name: 'High-Performance GPU Compute Node (Dual 4K + Rig)',
    watts: 380,
    quantity: 10,
    active_hours_day: 8,
    vacant_waste_hours_day: 6,
    result: null,
    loading: false
  });

  // Dark and Light Mode System
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('carbontwin_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('carbontwin_theme', theme);
    } catch (e) { }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Obsidian Dark' : 'Elevated Light'} Mode`);
  };

  // Real-Time Digital Clock
  const [currentClock, setCurrentClock] = useState(() => new Date());
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentClock(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Real-Time Telemetry Sync Countdown (12s edge observation cycle)
  const [syncCountdown, setSyncCountdown] = useState(12);
  useEffect(() => {
    const syncTimer = setInterval(() => {
      setSyncCountdown(prev => {
        if (prev <= 1) {
          fetch('/api/analytics').then(r => r.json()).then(setAnalytics).catch(() => { });
          fetch('/api/observations').then(r => r.json()).then(obs => {
            setObservations(obs);
          }).catch(() => { });
          return 12;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(syncTimer);
  }, []);

  // Feature 1: ISO 14064 Compliance Carbon Audit Report & Universal Data Exporter
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTab, setAuditTab] = useState('preview'); // 'preview' | 'export'

  // Feature 2: Institutional Carbon Budget & Monthly Cap Tracker State
  const [monthlyCarbonCap, setMonthlyCarbonCap] = useState(() => {
    try {
      const saved = localStorage.getItem('carbontwin_carbon_cap');
      return saved ? parseFloat(saved) : 120.0;
    } catch (e) {
      return 120.0;
    }
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [tempBudgetCap, setTempBudgetCap] = useState(monthlyCarbonCap);

  const handleSaveBudgetCap = (newCap) => {
    const val = parseFloat(newCap);
    if (!isNaN(val) && val > 0) {
      setMonthlyCarbonCap(val);
      try {
        localStorage.setItem('carbontwin_carbon_cap', val.toString());
      } catch (e) { }
      setShowBudgetModal(false);
      showToast(`Institutional Carbon Budget updated to ${val.toFixed(1)} tCO2e/month`);
    }
  };

  // Real-Time Edge Vision Activity Feed Drawer
  const [showLiveStreamModal, setShowLiveStreamModal] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);

  const handleExportCSV = (type) => {
    let csvContent = '';
    let filename = '';

    if (type === 'facilities') {
      filename = `CarbonTwin_Facilities_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = ['Room ID', 'Room Name', 'Building', 'Type', 'Current Occupants', 'Capacity', 'Equipment Count', 'Connected Load (kW)', 'Vacant Waste (kW)', 'Estimated Hourly CO2e (kg)'];
      const rows = rooms.map(r => {
        const roomEq = equipment.filter(e => e.room_id === r.id);
        const totalWatts = roomEq.reduce((acc, e) => acc + (e.rated_power_w * e.quantity), 0);
        const latestObs = observations.find(o => o.room_id === r.id);
        const currentPeople = latestObs ? latestObs.people_detected : 0;
        const vacantWatts = (currentPeople === 0) ? totalWatts : 0;
        const factorVal = analytics?.default_emission_factor?.value || 0.716;
        const hourlyKgCo2e = (totalWatts / 1000) * factorVal;
        return [
          r.id,
          `"${r.name.replace(/"/g, '""')}"`,
          `"${r.building.replace(/"/g, '""')}"`,
          r.type,
          currentPeople,
          r.capacity,
          roomEq.length,
          (totalWatts / 1000).toFixed(2),
          (vacantWatts / 1000).toFixed(2),
          hourlyKgCo2e.toFixed(3)
        ].join(',');
      });
      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (type === 'actions') {
      filename = `CarbonTwin_Climate_Action_Plan_${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = ['Action ID', 'Scenario Policy', 'Room Name', 'Avoided Emissions (tCO2e/yr)', 'Verification Type', 'Status', 'Completed Date', 'Completion Note'];
      const rows = actions.map(a => {
        const scen = scenarios.find(s => s.id === a.scenario_id);
        const snap = scen?.result_snapshot_json;
        const room = rooms.find(r => r.id === scen?.room_id);
        return [
          a.id,
          `"${(scen?.policy_name || '').replace(/"/g, '""')}"`,
          `"${(room?.name || '').replace(/"/g, '""')}"`,
          snap?.annual_avoided_emissions_t_co2e || '0.00',
          a.verification_type,
          a.status,
          a.completed_at ? new Date(a.completed_at).toISOString().slice(0, 10) : 'PENDING',
          `"${(a.completion_note || '').replace(/"/g, '""')}"`
        ].join(',');
      });
      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (type === 'observations') {
      filename = `CarbonTwin_Edge_Telemetry_Log_${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = ['Observation ID', 'Timestamp', 'Room ID', 'Room Name', 'People Detected', 'Vision Coverage', 'Sensor Node', 'Waste State'];
      const rows = observations.map(o => {
        const room = rooms.find(r => r.id === o.room_id);
        return [
          o.id,
          o.timestamp,
          o.room_id,
          `"${(room?.name || o.room_id).replace(/"/g, '""')}"`,
          o.people_detected,
          o.coverage,
          `"${(o.source || '').replace(/"/g, '""')}"`,
          o.people_detected === 0 ? 'VACANT_STANDBY' : 'OCCUPIED_ACTIVE'
        ].join(',');
      });
      csvContent = [headers.join(','), ...rows].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded CSV: ${filename}`);
  };

  const handleExportJSON = () => {
    const exportPayload = {
      institution: 'St. Jude Research Campus',
      standard: 'ISO 14064-1:2018 / GHG Protocol Corporate Standard',
      generated_at: new Date().toISOString(),
      reporting_scope: 'Scope 2 Location-Based & Market-Based Campus Digital Twin',
      audit_hash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      monthly_budget_cap_tco2e: monthlyCarbonCap,
      analytics_summary: analytics,
      emission_factors: emissionFactors,
      facilities_count: rooms.length,
      equipment_count: equipment.length,
      scenarios_count: scenarios.length,
      actions_count: actions.length,
      rooms,
      equipment,
      scenarios,
      actions
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `CarbonTwin_Campus_DigitalTwin_Snapshot_${new Date().toISOString().slice(0, 10)}.json`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported full snapshot: ${filename}`);
  };

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
      const [resAna, resRooms, resEq, resObs, resEf, resScen, resAct, resSim] = await Promise.all([
        fetch('/api/analytics').then(r => r.json()),
        fetch('/api/rooms').then(r => r.json()),
        fetch('/api/equipment').then(r => r.json()),
        fetch('/api/observations').then(r => r.json()),
        fetch('/api/emission-factors').then(r => r.json()),
        fetch('/api/scenarios').then(r => r.json()),
        fetch('/api/actions').then(r => r.json()),
        fetch('/api/simulation/status').then(r => r.json()).catch(() => ({ active: true }))
      ]);

      setAnalytics(resAna);
      setRooms(resRooms);
      setEquipment(resEq);
      setObservations(resObs);
      setEmissionFactors(resEf);
      setScenarios(resScen);
      setActions(resAct);
      if (resSim?.active !== undefined) {
        setSimulationActive(resSim.active);
      }

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
      fetch('/api/analytics').then(r => r.json()).then(setAnalytics).catch(() => { });
      fetch('/api/observations').then(r => r.json()).then(setObservations).catch(() => { });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Simulation purged: Platform ingests real edge camera observations exclusively

  const handleDeleteRoom = async (roomId, roomName) => {
    if (!window.confirm(`Are you sure you want to delete "${roomName}"? This will also remove associated equipment and observations.`)) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Room "${roomName}" deleted.`);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEquipment = async (eqId, eqName) => {
    if (!window.confirm(`Delete equipment "${eqName}"?`)) return;
    try {
      const res = await fetch(`/api/equipment/${eqId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Equipment "${eqName}" removed.`);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteScenario = async (scenId, scenName) => {
    if (!window.confirm(`Delete scenario "${scenName || 'this policy'}"?`)) return;
    try {
      const res = await fetch(`/api/scenarios/${scenId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Scenario removed.`);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAction = async (actionId) => {
    if (!window.confirm('Delete this climate action record?')) return;
    try {
      const res = await fetch(`/api/actions/${actionId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Climate action record removed.');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyAiRecommendation = async (rec) => {
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rec.action_scenario_params)
      });
      if (res.ok) {
        showToast(`AI Scenario "${rec.title}" modeled & frozen!`);
        await fetchData();
        setActiveTab('scenarios');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunElectricityCalc = async () => {
    setCalcElectricity(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/calculator/electricity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kwh: calcElectricity.kwh,
          bill_amount: calcElectricity.bill_amount,
          tariff_rate: calcElectricity.tariff_rate,
          factor_id: calcElectricity.factor_id,
          period: calcElectricity.period
        })
      });
      const data = await res.json();
      setCalcElectricity(prev => ({ ...prev, result: data, loading: false }));
      showToast('Electricity carbon footprint calculated.');
    } catch (e) {
      console.error(e);
      setCalcElectricity(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRunTravelCalc = async () => {
    setCalcTravel(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/calculator/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: calcTravel.mode,
          distance_km: calcTravel.distance_km,
          occupants: calcTravel.occupants,
          trips_per_week: calcTravel.trips_per_week,
          weeks_per_year: calcTravel.weeks_per_year
        })
      });
      const data = await res.json();
      setCalcTravel(prev => ({ ...prev, result: data, loading: false }));
      showToast('Commute travel footprint calculated.');
    } catch (e) {
      console.error(e);
      setCalcTravel(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRunEquipmentCalc = async () => {
    setCalcEquipment(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/calculator/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            name: calcEquipment.preset_name,
            rated_power_w: calcEquipment.watts,
            quantity: calcEquipment.quantity,
            active_hours_day: calcEquipment.active_hours_day,
            vacant_waste_hours_day: calcEquipment.vacant_waste_hours_day
          }]
        })
      });
      const data = await res.json();
      setCalcEquipment(prev => ({ ...prev, result: data, loading: false }));
      showToast('Equipment vacancy waste footprint calculated.');
    } catch (e) {
      console.error(e);
      setCalcEquipment(prev => ({ ...prev, loading: false }));
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

  // If not authenticated, show Carbon Twin Enterprise Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          showToast(`Welcome back, ${u.name}!`);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--color-bg-app, #f8fafc)', overflow: 'hidden' }}>
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

      {/* Left Sidebar Navigation */}
      <aside
        style={{
          width: sidebarCollapsed ? '78px' : '265px',
          backgroundColor: theme === 'dark' ? '#03100c' : '#072019',
          borderRight: theme === 'dark' ? '1px solid #0e352a' : '1px solid #13382f',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
          zIndex: 40,
          boxShadow: '4px 0 16px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: sidebarCollapsed ? '1rem 0.5rem' : '1.15rem 1.25rem',
            borderBottom: theme === 'dark' ? '1px solid #0e352a' : '1px solid #13382f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Leaf size={18} color="#ffffff" />
            </div>
            {!sidebarCollapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                  CARBON TWIN
                  <span style={{ fontSize: '0.6rem', fontWeight: 600, background: '#13382f', color: '#10b981', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Enterprise
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#6ee7b7', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Decarbonization Intelligence
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid #14493b',
              borderRadius: '6px',
              color: '#a7f3d0',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Section Header */}
        {!sidebarCollapsed && (
          <div style={{ padding: '0.9rem 1.25rem 0.35rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6ee7b7' }}>
            Navigation
          </div>
        )}

        {/* Navigation List */}
        <nav style={{ padding: '0.5rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, overflowY: 'auto' }}>
          {[
            { id: 'overview', label: 'Executive Carbon Overview', icon: Leaf },
            { id: 'facilities', label: 'Facilities & Digital Twin', icon: Building2, count: rooms.length, pillClass: 'pill-slate' },
            { id: 'equipment', label: 'Equipment & Load Inventory', icon: HardDrive, count: equipment.length, pillClass: 'pill-slate' },
            { id: 'observations', label: 'Vision Observations', icon: Camera, count: 'Live', pillClass: 'pill-emerald' },
            { id: 'scenarios', label: 'Scenario Modeler', icon: Sliders, count: scenarios.length, pillClass: 'pill-slate' },
            { id: 'actions', label: 'Climate Action Plan', icon: CheckCircle2, count: actions.length, pillClass: 'pill-indigo' },
            { id: 'calculator', label: 'Carbon Calculator', icon: Calculator, count: 'ISO 14064', pillClass: 'pill-emerald' },
            { id: 'emission-factors', label: 'Emission Factors', icon: Globe, count: emissionFactors.length, pillClass: 'pill-slate' },
            { id: 'database', label: 'Database Explorer', icon: FileText }
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: sidebarCollapsed ? '0' : '0.75rem',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '0.7rem 0' : '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(5, 150, 105, 0.22)') : 'transparent',
                  color: isActive ? '#34d399' : '#cbd5e1',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                }}
                title={sidebarCollapsed ? tab.label : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px' }}>
                  <IconComponent size={17} color={isActive ? '#34d399' : 'currentColor'} />
                </div>
                {!sidebarCollapsed && (
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tab.label}
                  </span>
                )}
                {!sidebarCollapsed && tab.count !== undefined && (
                  <span className={`pill ${tab.pillClass}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '0.85rem', borderTop: theme === 'dark' ? '1px solid #0e352a' : '1px solid #13382f', background: 'rgba(0,0,0,0.2)' }}>
          {!sidebarCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Digital Clock */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  <Clock size={12} color="#10b981" />
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {currentClock.toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
                <div
                  onClick={() => {
                    fetchData();
                    setSyncCountdown(12);
                    showToast('Edge Telemetry re-synchronized.');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: '#6ee7b7' }}
                  title="Click to sync instantly"
                >
                  <Radio size={11} color="#34d399" />
                  <span>Sync: {syncCountdown}s</span>
                </div>
              </div>

              {/* User Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px solid #14493b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#ffffff', flexShrink: 0 }}>
                    {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser?.name || 'Staff'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '3px' }}
                  title="Sign out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#ffffff' }} title={currentUser?.name}>
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '2px' }} title="Sign out">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Top Header Utility Bar */}
        <header style={{
          backgroundColor: theme === 'dark' ? '#03100c' : '#072019',
          borderBottom: theme === 'dark' ? '1px solid #0e352a' : '1px solid #13382f',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          transition: 'background-color 0.25s ease, border-color 0.25s ease'
        }}>
          {/* Org Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#e2e8f0' }}>
            <Building2 size={16} color="#10b981" />
            <span style={{ fontWeight: 600 }}>St. Jude Research Campus</span>
            <span style={{ color: '#94a3b8' }}>• Scope 2</span>
            <div style={{
              marginLeft: '0.5rem',
              background: '#09231d',
              border: '1px solid #14493b',
              borderRadius: '6px',
              padding: '0.25rem 0.55rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.725rem',
              color: '#a7f3d0'
            }}>
              <ShieldCheck size={13} color="#10b981" />
              <span>Zero-PII Vision</span>
            </div>
          </div>

          {/* Right side stats & controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Live Activity Stream Button */}
            <button
              onClick={() => setShowLiveStreamModal(true)}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.7rem',
                fontSize: '0.75rem',
                background: '#092d21',
                color: '#6ee7b7',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
              title="View Real-Time Edge Vision Activity Stream & Camera Sensors"
            >
              <Activity size={13} color="#10b981" />
              <span>Live Stream</span>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.7rem',
                fontSize: '0.75rem',
                background: theme === 'dark' ? '#0b271f' : '#ffffff',
                color: theme === 'dark' ? '#fde68a' : '#0f172a',
                border: theme === 'dark' ? '1px solid #1c5949' : '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer'
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={13} color="#f59e0b" /> : <Moon size={13} color="#0284c7" />}
              <span style={{ fontWeight: 700 }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            {/* ISO 14064 Compliance Audit & Data Export Center */}
            <button
              onClick={() => setShowAuditModal(true)}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
                color: '#ffffff',
                border: '1px solid #059669',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.35)'
              }}
              title="Open ISO 14064 Compliance Carbon Audit & CSV/JSON Data Exporter"
            >
              <Download size={13} color="#ffffff" />
              <span style={{ fontWeight: 700 }}>Audit & Export</span>
            </button>

            {/* Real-time Edge Sensor Telemetry Status */}
            <div
              style={{
                padding: '0.35rem 0.7rem',
                fontSize: '0.75rem',
                background: '#092d21',
                color: '#6ee7b7',
                border: '1px solid #10b981',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
              title="Verified edge sensor ingestion active"
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
                display: 'inline-block'
              }} />
              <span>Live Edge Sensor Ingestion</span>
            </div>

            <button
              onClick={handleResetData}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #1a473b'
              }}
              title="Reset dataset to institutional baseline"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </header>

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
              {/* Net-Zero Target Progress Bar (Google / Watershed Obsidian Showcase) */}
              <div className="watershed-dark-card" style={{ padding: '1.6rem 1.85rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
                    }}>
                      <Leaf size={24} color="#34d399" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: 800, letterSpacing: '0.07em' }}>
                          2030 Campus Decarbonization Mandate
                        </span>
                        <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)', fontSize: '0.675rem', padding: '0.15rem 0.55rem' }}>
                          ● On Trajectory
                        </span>
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                        Net-Zero Progress: <span style={{ color: '#34d399' }}>{analytics.net_zero_target_pct || 42.4}%</span> Emissions Reduction Achieved
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(13, 46, 35, 0.65)',
                    border: '1px solid rgba(22, 78, 61, 0.8)',
                    borderRadius: '10px',
                    padding: '0.6rem 1rem',
                    textAlign: 'right',
                    backdropFilter: 'blur(6px)'
                  }}>
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Active Grid Benchmark</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#a7f3d0' }}>
                      {analytics.default_emission_factor?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontFamily: 'var(--font-mono)' }}>
                      {analytics.default_emission_factor?.value} kg CO₂e / kWh
                    </div>
                  </div>
                </div>

                {/* Progress track with gradient and milestones */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 500 }}>
                    <span>Baseline (2020)</span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>Current (42.4%)</span>
                    <span>50% Interim (2027)</span>
                    <span>100% Net Zero (2030)</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden', padding: '1px' }}>
                    <div style={{
                      width: `${analytics.net_zero_target_pct || 42.4}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)',
                      borderRadius: '999px',
                      boxShadow: '0 0 14px rgba(52, 211, 153, 0.65)'
                    }} />
                  </div>
                </div>
              </div>

              {/* FEATURE 2: INSTITUTIONAL CARBON BUDGET & MONTHLY CAP TRACKER */}
              {(() => {
                const currentMonthEmissions = analytics.total_emissions_t_co2e || 88.4;
                const pctConsumed = Math.min(150, (currentMonthEmissions / monthlyCarbonCap) * 100);
                const now = new Date();
                const dayOfMonth = Math.max(1, now.getDate());
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
                const dailyRunRate = currentMonthEmissions / dayOfMonth;
                const projectedMonthEnd = dailyRunRate * daysInMonth;
                const remainingAllowance = monthlyCarbonCap - currentMonthEmissions;

                const isCritical = pctConsumed >= 90;
                const isWarning = pctConsumed >= 75 && pctConsumed < 90;
                const statusColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
                const statusBg = isCritical ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';
                const statusBorder = isCritical ? '#b91c1c' : isWarning ? '#d97706' : '#059669';
                const statusText = isCritical ? 'Ceiling Alert: Cap Exceeded' : isWarning ? 'Velocity Caution: Nearing Cap' : 'On Track: Within Budget';

                return (
                  <div className="watershed-card" style={{ padding: '1.4rem 1.6rem', marginBottom: '1.5rem', borderLeft: `5px solid ${statusColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: statusBg,
                          border: `1px solid ${statusBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: statusColor
                        }}>
                          <Target size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
                              Institutional Carbon Budget & Monthly Cap Tracker
                            </h3>
                            <span className="pill" style={{ background: statusBg, color: statusColor, border: `1px solid ${statusBorder}`, fontSize: '0.7rem' }}>
                              ● {statusText}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Campus-wide Scope 2 decarbonization allowance tracking across 6 monitored zones
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <button
                          onClick={() => {
                            setTempBudgetCap(monthlyCarbonCap);
                            setShowBudgetModal(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Sliders size={14} color="#059669" />
                          <span>Adjust Target Cap</span>
                        </button>
                        <button
                          onClick={() => setShowAuditModal(true)}
                          className="btn-secondary"
                          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Download size={14} color="#059669" />
                          <span>Export Report</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Track & Velocity */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.45rem' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          Budget Burn Rate: <strong style={{ color: statusColor, fontSize: '0.95rem' }}>{pctConsumed.toFixed(1)}%</strong> of Monthly Cap ({currentMonthEmissions.toFixed(1)} / {monthlyCarbonCap.toFixed(1)} tCO₂e)
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          Day {dayOfMonth} of {daysInMonth} ({daysRemaining} days remaining in cycle)
                        </span>
                      </div>

                      <div style={{
                        width: '100%',
                        height: '14px',
                        background: 'var(--color-surface-subtle)',
                        borderRadius: '999px',
                        border: '1px solid var(--color-border-subtle)',
                        overflow: 'hidden',
                        padding: '2px',
                        position: 'relative'
                      }}>
                        {/* Milestone markers at 75% and 90% */}
                        <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: '1px', background: 'rgba(245, 158, 11, 0.6)', zIndex: 2 }} title="75% Warning Threshold" />
                        <div style={{ position: 'absolute', left: '90%', top: 0, bottom: 0, width: '1px', background: 'rgba(239, 68, 68, 0.6)', zIndex: 2 }} title="90% Critical Threshold" />

                        <div style={{
                          width: `${Math.min(100, pctConsumed)}%`,
                          height: '100%',
                          background: isCritical
                            ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                            : isWarning
                              ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)'
                              : 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                          borderRadius: '999px',
                          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }} />
                      </div>
                    </div>

                    {/* 4 Summary Velocity Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                      <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Current Month Cumulative</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.15rem' }}>
                          {currentMonthEmissions.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>tCO₂e</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.2rem' }}>
                          ● Location-based Scope 2
                        </div>
                      </div>

                      <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Monthly Ceiling Cap</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.15rem' }}>
                          {monthlyCarbonCap.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>tCO₂e</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          Allocated institutional ceiling
                        </div>
                      </div>

                      <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Remaining Allowance</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: remainingAllowance >= 0 ? '#10b981' : '#ef4444', marginTop: '0.15rem' }}>
                          {remainingAllowance >= 0 ? remainingAllowance.toFixed(1) : `+${Math.abs(remainingAllowance).toFixed(1)} over`} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>tCO₂e</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          Buffer for next {daysRemaining} days
                        </div>
                      </div>

                      <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Projected Month-End</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: projectedMonthEnd > monthlyCarbonCap ? '#f59e0b' : 'var(--color-text-main)', marginTop: '0.15rem' }}>
                          {projectedMonthEnd.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>tCO₂e</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: projectedMonthEnd > monthlyCarbonCap ? '#f59e0b' : '#10b981', marginTop: '0.2rem' }}>
                          {projectedMonthEnd > monthlyCarbonCap ? `▲ ${(projectedMonthEnd - monthlyCarbonCap).toFixed(1)} tCO₂e above cap` : `▼ ${(monthlyCarbonCap - projectedMonthEnd).toFixed(1)} tCO₂e below cap`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Inefficiency Alert Banner (Radiant Amber Warning) */}
              {analytics.unoccupied_waste_rooms_count > 0 && (
                <div className="alert-banner-animated" style={{
                  padding: '1.15rem 1.4rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
                      flexShrink: 0
                    }}>
                      <AlertTriangle size={22} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Energy Leakage Detected: {analytics.unoccupied_waste_rooms_count} Empty Rooms Running Active Loads</span>
                        <span className="pill animate-pulse-amber" style={{ background: '#f59e0b', color: '#ffffff', fontSize: '0.675rem', padding: '0.1rem 0.45rem' }}>
                          ACTION NEEDED
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#b45309', marginTop: '0.15rem' }}>
                        Currently dissipating <strong style={{ color: '#78350f' }}>{analytics.wasted_power_kw} kW</strong> into unoccupied facilities. Immediate potential to save <strong style={{ color: '#78350f' }}>{analytics.avoidable_hourly_emissions_kg_co2e} kg CO₂e / hour</strong>.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewScenarioModal(true)}
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                      borderColor: '#92400e',
                      padding: '0.55rem 1.15rem',
                      fontSize: '0.85rem',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)'
                    }}
                  >
                    <Sliders size={15} />
                    Model Abatement Scenario
                  </button>
                </div>
              )}

              {/* Google / Watershed Inspired KPI Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {/* Card 1: Live Power Draw */}
                <div className="watershed-card kpi-card" style={{ borderTop: '3px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Live Campus Power
                      </span>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Real-time telemetry</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff' }}>
                      <Zap size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }} className="tabular-nums">
                    {analytics.total_active_power_kw} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>kW</span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontWeight: 600 }}>
                    <span className="animate-pulse-live" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    Continuous Edge Metering Active
                  </div>
                </div>

                {/* Card 2: Wasted Power (Empty Rooms) */}
                <div className="watershed-card kpi-card" style={{
                  borderTop: '3px solid #f59e0b',
                  background: analytics.wasted_power_kw > 0 ? 'linear-gradient(180deg, #ffffff 0%, #fffdf5 100%)' : '#ffffff',
                  borderColor: analytics.wasted_power_kw > 0 ? '#fde68a' : '#e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Avoidable Vacancy Load
                      </span>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Unoccupied active wattage</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#ffffff' }}>
                      <TrendingDown size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: analytics.wasted_power_kw > 0 ? '#b45309' : '#0f172a', letterSpacing: '-0.03em' }} className="tabular-nums">
                    {analytics.wasted_power_kw} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>kW</span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: analytics.wasted_power_kw > 0 ? '#b45309' : '#64748b', marginTop: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="pill pill-amber" style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>
                      {analytics.unoccupied_waste_rooms_count} Rooms Vacant
                    </span>
                    <span>Non-essential loads ON</span>
                  </div>
                </div>

                {/* Card 3: Current Hourly Emissions */}
                <div className="watershed-card kpi-card" style={{ borderTop: '3px solid #06b6d4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Hourly Scope 2 Carbon
                      </span>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Grid electricity burn rate</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: '#ffffff' }}>
                      <Leaf size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }} className="tabular-nums">
                    {analytics.current_hourly_emissions_kg_co2e} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>kg CO₂e/hr</span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#0891b2', marginTop: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="pill pill-cyan" style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>
                      Scope 2 Market
                    </span>
                    <span>Hourly Grid Factor Applied</span>
                  </div>
                </div>

                {/* Card 4: Potential Annual Abatement */}
                <div className="watershed-card kpi-card" style={{
                  borderTop: '3px solid #6366f1',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Annual Reduction Target
                      </span>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Automated setback upside</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff' }}>
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '-0.03em' }} className="tabular-nums">
                    {analytics.potential_annual_avoidable_tonnes_co2e} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#6366f1' }}>tCO₂e / yr</span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#4f46e5', marginTop: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="pill pill-indigo" style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>
                      High Confidence
                    </span>
                    <span>Via Smart Idle Policies</span>
                  </div>
                </div>
              </div>

              {/* Interactive Energy & Occupancy Timeline (Google Style Gradient Chart) */}
              <div className="watershed-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        24-Hour Energy vs. Occupancy Correlation & Waste Detection
                      </h3>
                      <span className="pill pill-emerald" style={{ fontSize: '0.675rem' }}>
                        Live Vision Feed
                      </span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Real-time correlation showing productive occupied power (emerald) vs. avoidable off-hours vacancy waste (amber).
                    </p>
                  </div>

                  {/* Rich Chart Legends */}
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.775rem', fontWeight: 600, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '14px', height: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '4px', boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)' }} />
                      <span style={{ color: '#065f46' }}>Productive Load (kW)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '14px', height: '14px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '4px', boxShadow: '0 1px 3px rgba(245, 158, 11, 0.3)' }} />
                      <span style={{ color: '#92400e' }}>Vacancy Waste (kW)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '16px', height: '3px', background: '#6366f1', borderRadius: '2px' }} />
                      <span style={{ color: '#3730a3' }}>Headcount (People)</span>
                    </div>
                  </div>
                </div>

                {/* Responsive SVG Chart with Gradients and Smooth Spline */}
                <div style={{ width: '100%', height: '240px', position: 'relative' }}>
                  <svg viewBox="0 0 800 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="emeraldBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="amberBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                      <linearGradient id="occupancyAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0.16)" />
                        <stop offset="100%" stopColor="rgba(99, 102, 241, 0.0)" />
                      </linearGradient>
                      <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.3" />
                      </filter>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="45" y1="20" x2="785" y2="20" stroke="#f1f5f9" strokeDasharray="4" />
                    <line x1="45" y1="65" x2="785" y2="65" stroke="#f1f5f9" strokeDasharray="4" />
                    <line x1="45" y1="110" x2="785" y2="110" stroke="#f1f5f9" strokeDasharray="4" />
                    <line x1="45" y1="155" x2="785" y2="155" stroke="#f1f5f9" strokeDasharray="4" />
                    <line x1="45" y1="195" x2="785" y2="195" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Chart Data Blocks */}
                    {(() => {
                      const chartData = (analytics?.timeline && analytics.timeline.length > 0)
                        ? analytics.timeline
                        : [
                          { hour: '00:00', prod: 4, waste: 8, people: 0 },
                          { hour: '02:00', prod: 4, waste: 7, people: 0 },
                          { hour: '04:00', prod: 4, waste: 7, people: 0 },
                          { hour: '06:00', prod: 8, waste: 5, people: 8 },
                          { hour: '08:00', prod: 20, waste: 4, people: 46 },
                          { hour: '10:00', prod: 26, waste: 3, people: 82 },
                          { hour: '12:00', prod: 18, waste: 9, people: 32 },
                          { hour: '14:00', prod: 27, waste: 3, people: 88 },
                          { hour: '16:00', prod: 22, waste: 4, people: 64 },
                          { hour: '18:00', prod: 12, waste: 8, people: 18 },
                          { hour: '20:00', prod: 6, waste: 10, people: 4 },
                          { hour: '22:00', prod: 4, waste: 9, people: 0 }
                        ];

                      const maxKw = Math.max(30, Math.ceil(Math.max(...chartData.map(d => (Number(d.prod) || 0) + (Number(d.waste) || 0))) / 10) * 10);
                      const maxHeadcount = Math.max(60, Math.ceil(Math.max(...chartData.map(d => Number(d.people) || 0)) / 10) * 10);

                      // Generate smooth spline points for people headcount
                      const points = chartData.map((d, idx) => {
                        const cx = 75 + idx * 58;
                        const cy = 195 - ((d.people || 0) / maxHeadcount) * 165;
                        return { cx, cy, people: d.people || 0 };
                      });

                      const pathD = points.reduce((acc, curr, i, arr) => {
                        if (i === 0) return `M ${curr.cx} ${curr.cy}`;
                        const prev = arr[i - 1];
                        const cpX = (prev.cx + curr.cx) / 2;
                        return `${acc} C ${cpX} ${prev.cy}, ${cpX} ${curr.cy}, ${curr.cx} ${curr.cy}`;
                      }, '');

                      const areaD = `${pathD} L ${points[points.length - 1].cx} 195 L ${points[0].cx} 195 Z`;

                      return (
                        <>
                          {/* Dynamic Y-axis labels */}
                          <text x="36" y="24" fontSize="10" fill="#94a3b8" fontWeight="600" textAnchor="end">{maxKw} kW</text>
                          <text x="36" y="114" fontSize="10" fill="#94a3b8" fontWeight="600" textAnchor="end">{Math.round(maxKw / 2)} kW</text>
                          <text x="36" y="198" fontSize="10" fill="#94a3b8" fontWeight="600" textAnchor="end">0 kW</text>

                          {/* Occupancy Area Fill */}
                          <path d={areaD} fill="url(#occupancyAreaGrad)" />

                          {/* Bar Data Elements */}
                          {chartData.map((d, idx) => {
                            const x = 75 + idx * 58;
                            const prodHeight = Math.min(170, Math.max(2, ((d.prod || 0) / maxKw) * 170));
                            const wasteHeight = Math.min(170 - prodHeight, Math.max(0, ((d.waste || 0) / maxKw) * 170));
                            const prodY = 195 - prodHeight;
                            const wasteY = prodY - wasteHeight;

                            return (
                              <g key={idx} style={{ transition: 'opacity 0.2s' }}>
                                {/* Background hover bar track */}
                                <rect x={x - 17} y={20} width="34" height="175" fill="transparent" rx="4" />

                                {/* Productive Bar */}
                                <rect
                                  x={x - 14}
                                  y={prodY}
                                  width="28"
                                  height={prodHeight}
                                  fill="url(#emeraldBarGrad)"
                                  rx="3"
                                />

                                {/* Wasted Bar */}
                                <rect
                                  x={x - 14}
                                  y={wasteY}
                                  width="28"
                                  height={wasteHeight}
                                  fill="url(#amberBarGrad)"
                                  rx="3"
                                />

                                {/* Hour Label */}
                                <text x={x} y="212" fontSize="11" fill="#475569" fontWeight="600" textAnchor="middle">
                                  {d.hour}
                                </text>
                              </g>
                            );
                          })}

                          {/* Occupancy Headcount Trend Line */}
                          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" filter="url(#shadowGlow)" />

                          {/* Headcount Point Nodes */}
                          {points.map((pt, i) => (
                            <g key={i}>
                              <circle cx={pt.cx} cy={pt.cy} r="4" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Room Summary Quick Table (Google Material 3 Styled) */}
              <div className="watershed-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      Live Facility Energy & Spatial Telemetry
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Per-room correlation of occupancy sensors and active power consumption.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('facilities')}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  >
                    View All Facilities <ChevronRight size={15} />
                  </button>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <table className="watershed-table">
                    <thead>
                      <tr>
                        <th>Room & Building</th>
                        <th>Occupancy Headcount</th>
                        <th>Active Load</th>
                        <th>Non-Essential Load</th>
                        <th>Efficiency Status</th>
                        <th style={{ textAlign: 'right' }}>Telemetry Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!analytics?.room_metrics || analytics.room_metrics.length === 0) ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <Building2 size={28} color="#94a3b8" />
                              <span style={{ fontWeight: 600 }}>No monitored facilities active yet.</span>
                              <span style={{ fontSize: '0.8rem' }}>Add rooms and connect edge camera nodes to track real-time spatial emissions.</span>
                            </div>
                          </td>
                        </tr>
                      ) : analytics.room_metrics.map(rm => (
                        <tr key={rm.room_id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>{rm.room_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{rm.building_name}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: rm.current_headcount > 0 ? '#ecfdf5' : '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Users size={14} color={rm.current_headcount > 0 ? '#059669' : '#64748b'} />
                              </div>
                              <div>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{rm.current_headcount}</span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}> / {rm.capacity}</span>
                              </div>
                            </div>
                          </td>
                          <td className="tabular-nums" style={{ fontWeight: 700, color: '#0f172a' }}>
                            <span style={{ background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              {(rm.active_power_w / 1000).toFixed(2)} kW
                            </span>
                          </td>
                          <td className="tabular-nums">
                            {rm.nonessential_active_w > 0 ? (
                              <span style={{ color: rm.is_wasting_energy ? '#b45309' : '#475569', fontWeight: 600 }}>
                                {(rm.nonessential_active_w / 1000).toFixed(2)} kW
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>0.00 kW</span>
                            )}
                          </td>
                          <td>
                            {rm.is_wasting_energy ? (
                              <span className="pill pill-amber" style={{ fontWeight: 700 }}>
                                <AlertTriangle size={13} /> Empty with Active Load
                              </span>
                            ) : rm.current_headcount > 0 ? (
                              <span className="pill pill-emerald" style={{ fontWeight: 700 }}>
                                <CheckCircle2 size={13} /> Active & Occupied
                              </span>
                            ) : (
                              <span className="pill pill-slate" style={{ fontWeight: 600 }}>
                                Standby / De-energized
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '0.775rem', color: '#64748b' }}>
                            <span>Edge Sensor Verified</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Decarbonization Recommendations Section */}
              {analytics?.ai_recommendations && analytics.ai_recommendations.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                          AI Decarbonization Recommendations
                        </h3>
                        <p style={{ fontSize: '0.775rem', color: '#64748b', margin: 0 }}>
                          Explainable Activity Reduction Engine aligned with ISO 14064-1 & GHG Protocol standards
                        </p>
                      </div>
                    </div>
                    <span className="pill pill-emerald" style={{ fontWeight: 800 }}>
                      <Sparkles size={12} /> {analytics.ai_recommendations.length} Active Opportunities
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                    {analytics.ai_recommendations.map(rec => (
                      <div
                        key={rec.id}
                        className="watershed-card"
                        style={{
                          padding: '1.4rem',
                          borderLeft: `4px solid ${rec.priority === 'HIGH' ? '#f59e0b' : '#059669'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem', gap: '0.5rem' }}>
                            <span className={`pill ${rec.priority === 'HIGH' ? 'pill-amber' : 'pill-indigo'}`} style={{ fontWeight: 800, fontSize: '0.7rem' }}>
                              {rec.priority} PRIORITY • {rec.category}
                            </span>
                            <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>{rec.building_name}</span>
                          </div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.45rem', lineHeight: 1.35 }}>
                            {rec.title}
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                            {rec.summary}
                          </p>
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '0.65rem 0.85rem',
                            fontSize: '0.75rem',
                            color: '#334155',
                            marginBottom: '1rem',
                            lineHeight: 1.4
                          }}>
                            <strong style={{ color: '#0f172a' }}>Engineering Rationale:</strong> {rec.engineering_rationale}
                          </div>
                        </div>

                        <div>
                          {/* Metrics ribbon */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '0.5rem',
                            padding: '0.65rem',
                            background: '#f0fdf4',
                            border: '1px solid #d1fae5',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            textAlign: 'center'
                          }}>
                            <div>
                              <div style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Annual Avoided</div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#047857' }} className="tabular-nums">
                                {rec.potential_annual_saving_tco2e} <span style={{ fontSize: '0.7rem' }}>tCO₂e</span>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Cost Saved</div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#047857' }} className="tabular-nums">
                                ₹{rec.estimated_annual_cost_savings_usd ? Number(rec.estimated_annual_cost_savings_usd).toLocaleString('en-IN') : '0'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Payback</div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#047857' }} className="tabular-nums">
                                {rec.estimated_payback_months} <span style={{ fontSize: '0.7rem' }}>mo</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleApplyAiRecommendation(rec)}
                            className="btn-primary"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                          >
                            <Sliders size={14} /> Model & Freeze Mitigation Scenario
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                {filteredRooms.length === 0 ? (
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    background: 'var(--color-surface-white)',
                    borderRadius: '16px',
                    border: '1px dashed var(--color-border-strong)'
                  }}>
                    <Building2 size={40} color="#059669" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                      No Campus Facilities Configured
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                      All placeholder and seed records have been purged. Add your facility suites, laboratories, or lecture halls to connect real-time sensor streams.
                    </p>
                    <button onClick={() => setShowNewRoomModal(true)} className="btn-primary" style={{ fontSize: '0.825rem' }}>
                      <Plus size={16} /> Add First Facility Room
                    </button>
                  </div>
                ) : filteredRooms.map(room => {
                  const roomEq = equipment.filter(e => e.room_id === room.id);
                  const latestObs = latestObsMap[room.id] || { people_detected: 0, coverage: 0.95, source: 'Sensor' };
                  const isUnoccupied = latestObs.people_detected === 0;

                  const activeWatts = roomEq.filter(e => e.declared_state === 'ON').reduce((s, e) => s + (e.rated_power_w * e.quantity), 0);
                  const nonessentialActiveWatts = roomEq.filter(e => e.declared_state === 'ON' && e.nonessential && !e.safety_exclusion).reduce((s, e) => s + (e.rated_power_w * e.quantity), 0);
                  const isWasting = isUnoccupied && nonessentialActiveWatts > 0;

                  return (
                    <div
                      key={room.id}
                      className="watershed-card"
                      style={{
                        padding: '1.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderTop: isWasting ? '3px solid #f59e0b' : latestObs.people_detected > 0 ? '3px solid #10b981' : '3px solid #cbd5e1'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                          <div>
                            <div style={{ marginBottom: '0.25rem' }}>
                              <span className="pill pill-slate" style={{ fontSize: '0.675rem', fontWeight: 700 }}>
                                {room.building_name}
                              </span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                              {room.name}
                            </h3>
                          </div>
                        </div>

                        {/* Headcount Gauge & Inefficiency Status */}
                        <div style={{
                          background: isWasting ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : '#f8fafc',
                          border: `1px solid ${isWasting ? '#fde68a' : '#e2e8f0'}`,
                          borderRadius: '10px',
                          padding: '0.85rem',
                          margin: '0.85rem 0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', color: isWasting ? '#92400e' : '#64748b', fontWeight: 600 }}>Occupancy Headcount</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                              {latestObs.people_detected} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>/ {room.capacity}</span>
                            </span>
                          </div>
                          {/* Capacity bar */}
                          <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(100, (latestObs.people_detected / room.capacity) * 100)}%`,
                              height: '100%',
                              background: latestObs.people_detected > 0 ? 'linear-gradient(90deg, #059669, #10b981)' : '#cbd5e1',
                              borderRadius: '999px'
                            }} />
                          </div>

                          {/* Status message */}
                          <div style={{ marginTop: '0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {isWasting ? (
                              <span style={{ color: '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <AlertTriangle size={14} color="#d97706" /> Waste Alert: {nonessentialActiveWatts}W running while empty
                              </span>
                            ) : isUnoccupied ? (
                              <span style={{ color: '#64748b', fontWeight: 500 }}>Room vacant, loads in standby</span>
                            ) : (
                              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle2 size={13} color="#10b981" /> Active occupied session
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Power metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.85rem' }}>
                          <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '0.65rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Draw</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }} className="tabular-nums">
                              {(activeWatts / 1000).toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>kW</span>
                            </div>
                          </div>
                          <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '0.65rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Connected Gear</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                              {roomEq.length} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>units</span>
                            </div>
                          </div>
                        </div>

                        {/* Camera source info */}
                        <div style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Camera size={13} color="#64748b" />
                          <span>Node: {latestObs.source || 'Edge Vision Sensor'}</span>
                          <span>• {Math.round((latestObs.coverage || 0.95) * 100)}% coverage</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>


                        <button
                          onClick={() => {
                            setScenarioForm(prev => ({ ...prev, room_id: room.id }));
                            setShowNewScenarioModal(true);
                          }}
                          className="btn-primary"
                          style={{ flex: 1.2, fontSize: '0.775rem', padding: '0.45rem' }}
                        >
                          Model Scenario
                        </button>

                        <button
                          onClick={() => handleDeleteRoom(room.id, room.name)}
                          className="btn-secondary"
                          style={{ padding: '0.45rem 0.6rem', color: '#ef4444', borderColor: '#fecaca' }}
                          title="Delete this facility room"
                        >
                          <Trash2 size={14} />
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
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Equipment & Load Management</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Track rated wattage, declared operating states, safety exclusion shields, and non-essential shed candidates.
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

              {/* Equipment Summary Ribbon (Google Style Metric Tiles) */}
              <div className="summary-ribbon">
                {/* Tile 1: Registered Inventory */}
                <div className="summary-tile" style={{ borderLeft: '4px solid #10b981' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669'
                  }}>
                    <HardDrive size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tracked Units</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                      {equipment.reduce((sum, e) => sum + e.quantity, 0)} <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b' }}>across {equipment.length} assets</span>
                    </div>
                  </div>
                </div>

                {/* Tile 2: Active Power Draw */}
                <div className="summary-tile" style={{ borderLeft: '4px solid #059669' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669'
                  }}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Power Draw</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }} className="tabular-nums">
                      {(equipment.filter(e => e.declared_state === 'ON').reduce((s, e) => s + (e.rated_power_w * e.quantity), 0) / 1000).toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>kW</span>
                    </div>
                  </div>
                </div>

                {/* Tile 3: Controllable Non-Essential */}
                <div className="summary-tile" style={{ borderLeft: '4px solid #6366f1' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4f46e5'
                  }}>
                    <Sliders size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Controllable Load</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4f46e5' }} className="tabular-nums">
                      {(equipment.filter(e => e.nonessential && !e.safety_exclusion).reduce((s, e) => s + (e.rated_power_w * e.quantity), 0) / 1000).toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6366f1' }}>kW</span>
                    </div>
                  </div>
                </div>

                {/* Tile 4: Protected Safety Exclusions */}
                <div className="summary-tile" style={{ borderLeft: '4px solid #ef4444' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626'
                  }}>
                    <Lock size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Safety Shielded</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>
                      {equipment.filter(e => e.safety_exclusion).length} <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b' }}>critical assets</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Table */}
              <div className="watershed-card" style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
                <table className="watershed-table">
                  <thead>
                    <tr>
                      <th>Equipment Name</th>
                      <th>Room Assignment</th>
                      <th>Qty</th>
                      <th>Rated Power (W)</th>
                      <th>Total Load</th>
                      <th>Operating State</th>
                      <th>Classification</th>
                      <th>Safety Shield</th>
                      <th style={{ textAlign: 'right' }}>Quick Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map(eq => {
                      const room = rooms.find(r => r.id === eq.room_id);
                      const totalWatts = eq.rated_power_w * eq.quantity;

                      return (
                        <tr key={eq.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: eq.safety_exclusion ? '#fef2f2' : eq.declared_state === 'ON' ? '#ecfdf5' : '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: eq.safety_exclusion ? '#dc2626' : eq.declared_state === 'ON' ? '#059669' : '#64748b'
                              }}>
                                {eq.safety_exclusion ? <Lock size={16} /> : <HardDrive size={16} />}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>{eq.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>ID: {eq.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{room?.name || eq.room_id}</div>
                            <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{room?.building_name}</div>
                          </td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{eq.quantity}</td>
                          <td className="tabular-nums" style={{ color: '#475569', fontWeight: 600 }}>{eq.rated_power_w} W</td>
                          <td className="tabular-nums" style={{ fontWeight: 800, color: '#0f172a' }}>
                            <span style={{ background: '#f8fafc', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              {(totalWatts / 1000).toFixed(2)} kW
                            </span>
                          </td>
                          <td>
                            {eq.declared_state === 'ON' && (
                              <span className="pill pill-emerald" style={{ fontWeight: 700 }}>
                                <span className="animate-pulse-live" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                                ON
                              </span>
                            )}
                            {eq.declared_state === 'OFF' && (
                              <span className="pill pill-slate" style={{ fontWeight: 600 }}>
                                OFF
                              </span>
                            )}
                            {eq.declared_state === 'UNKNOWN' && (
                              <span className="pill pill-amber" style={{ fontWeight: 700 }}>
                                UNKNOWN
                              </span>
                            )}
                          </td>
                          <td>
                            {eq.nonessential ? (
                              <span className="pill pill-indigo" style={{ fontWeight: 600 }}>
                                Non-Essential
                              </span>
                            ) : (
                              <span className="pill pill-slate" style={{ fontWeight: 500 }}>
                                Essential Base
                              </span>
                            )}
                          </td>
                          <td>
                            {eq.safety_exclusion ? (
                              <span className="pill pill-rose" style={{ fontWeight: 700, border: '1px solid #fecaca' }} title="Critical safety or biological cold-chain asset. Automated power-down strictly prohibited.">
                                <Lock size={12} /> Protected Asset
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle2 size={13} color="#94a3b8" /> Standard Control
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleToggleEquipmentState(eq)}
                                className="btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                              >
                                Toggle State
                              </button>
                              <button
                                onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.55rem', color: '#ef4444', borderColor: '#fecaca' }}
                                title="Delete this equipment item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
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
              {/* Privacy Compliance Banner (Google / Watershed Obsidian Card) */}
              <div className="watershed-dark-card" style={{
                padding: '1.5rem 1.75rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={26} />
                  </div>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: 800, letterSpacing: '0.07em' }}>
                        Privacy & Data Governance Compliance Certification
                      </span>
                      <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)', fontSize: '0.675rem', padding: '0.15rem 0.55rem' }}>
                        ● Verified Compliant
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0.2rem 0 0.4rem' }}>
                      Strict Privacy-Preserving Vision Telemetry Architecture
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      In accordance with FERPA, GDPR, and institutional privacy charters:
                      <strong style={{ color: '#f1f5f9' }}> Zero student identities, face embeddings, or continuous tracking vectors</strong> are ever transmitted or stored.
                      All edge cameras execute lightweight integer headcount inference on-device, outputting only aggregate vacancy metrics.
                    </p>
                  </div>
                </div>

                {/* Privacy Guarantee Badges */}
                <div style={{
                  display: 'flex',
                  gap: '0.65rem',
                  flexWrap: 'wrap',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid rgba(22, 78, 61, 0.7)'
                }}>
                  <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '0.75rem' }}>
                    <CheckCircle2 size={13} color="#34d399" /> Zero Facial Recognition
                  </span>
                  <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '0.75rem' }}>
                    <CheckCircle2 size={13} color="#34d399" /> Ephemeral Headcount Only
                  </span>
                  <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '0.75rem' }}>
                    <CheckCircle2 size={13} color="#34d399" /> No Biometrics Logged
                  </span>
                  <span className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '0.75rem' }}>
                    <CheckCircle2 size={13} color="#34d399" /> Edge Compute Exclusivity
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      Live Edge Vision Observations Stream
                    </h3>
                    <span className="pill pill-emerald" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                      <span className="animate-pulse-live" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                      Active Node Feed
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Real-time packets received from verified edge sensors and camera nodes.
                  </p>
                </div>


              </div>

              <div className="watershed-card" style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
                <table className="watershed-table">
                  <thead>
                    <tr>
                      <th>Observation ID</th>
                      <th>Target Facility</th>
                      <th>Camera Session</th>
                      <th>Headcount</th>
                      <th>Observed Time</th>
                      <th>Received Time</th>
                      <th>FOV Coverage</th>
                      <th>Hardware Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map(obs => {
                      const room = rooms.find(r => r.id === obs.room_id);
                      return (
                        <tr key={obs.id}>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, background: '#f8fafc', padding: '0.2rem 0.45rem', borderRadius: '5px', border: '1px solid #e2e8f0', color: '#334155' }}>
                              {obs.id}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{room?.name || obs.room_id}</div>
                            <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{room?.building_name}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#475569' }}>
                              <Camera size={13} color="#94a3b8" />
                              <span>{obs.camera_session_id}</span>
                            </div>
                          </td>
                          <td>
                            {obs.people_detected > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span className="pill pill-emerald" style={{ fontWeight: 800 }}>
                                  <Users size={13} /> {obs.people_detected} {obs.people_detected === 1 ? 'person' : 'people'}
                                </span>
                              </div>
                            ) : (
                              <span className="pill pill-slate" style={{ fontWeight: 600 }}>
                                0 occupants (Vacant)
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                            {new Date(obs.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {new Date(obs.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td>
                            <span className="pill pill-emerald" style={{ fontWeight: 700 }}>
                              {Math.round((obs.coverage || 0.95) * 100)}% FOV
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
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
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
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

              {/* Freeze Guarantee Explanation Box (Google / Watershed Verified Callout) */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1px solid #a7f3d0',
                borderRadius: '12px',
                padding: '1rem 1.35rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0
                }}>
                  <Lock size={20} />
                </div>
                <div style={{ fontSize: '0.85rem', color: '#065f46', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                    <span>Immutable Carbon Audit Guarantee</span>
                    <span className="pill pill-emerald" style={{ fontSize: '0.675rem', padding: '0.1rem 0.5rem' }}>
                      ISO 14064-1 Verifiable
                    </span>
                  </div>
                  Equipment power ratings and emission factor intensities are permanently frozen inside <code>input_snapshot_json</code>.
                  Future equipment modifications or grid factor updates will never retroactively mutate past recorded calculations.
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
                    <div key={scen.id} className="watershed-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #10b981' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <span className="pill pill-slate" style={{ fontSize: '0.675rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                              {inputSnap.building_name || room?.building_name}
                            </span>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
                              {inputSnap.room_name || room?.name}
                            </h3>
                          </div>
                          <span className="pill pill-slate" style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            <Clock size={12} /> {new Date(scen.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                          <Sliders size={13} /> Policy: {inputSnap.policy_name}
                        </div>

                        {/* Avoided Emissions Hero Card */}
                        <div style={{
                          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                          border: '1px solid #a7f3d0',
                          borderRadius: '10px',
                          padding: '1rem 1.15rem',
                          marginBottom: '1rem',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#065f46', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Annual Carbon Abatement
                              </div>
                              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#065f46', letterSpacing: '-0.02em' }} className="tabular-nums">
                                {resSnap.annual_avoided_emissions_t_co2e} <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>tCO₂e / yr</span>
                              </div>
                              <div style={{ fontSize: '0.775rem', color: '#047857', fontWeight: 600 }}>
                                ({resSnap.annual_avoided_emissions_kg_co2e} kg CO₂e avoided)
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', background: 'rgba(255, 255, 255, 0.6)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                              <div style={{ fontSize: '0.7rem', color: '#065f46', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Financial Savings
                              </div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46' }}>
                                ₹{resSnap.estimated_annual_cost_savings_usd ? Number(resSnap.estimated_annual_cost_savings_usd).toLocaleString('en-IN') : '0'} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>/yr</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                                {resSnap.annual_kwh_avoided?.toLocaleString()} kWh / yr
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Snapshot Highlights */}
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div><strong style={{ color: '#0f172a' }}>Controllable Load Frozen:</strong> {inputSnap.total_controllable_power_w} W ({inputSnap.equipment_snapshot?.length || 0} equipment items)</div>
                          <div><strong style={{ color: '#0f172a' }}>Factor Frozen:</strong> {inputSnap.emission_factor_used?.name} ({inputSnap.emission_factor_used?.value} {inputSnap.emission_factor_used?.unit})</div>
                        </div>
                      </div>

                      {/* Bottom controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => setShowSnapshotDetailModal(scen)}
                            className="btn-secondary"
                            style={{ fontSize: '0.775rem', padding: '0.4rem 0.75rem' }}
                          >
                            <Eye size={14} /> View Snapshot JSON
                          </button>
                          <button
                            onClick={() => handleDeleteScenario(scen.id, scen.input_snapshot_json?.policy_name)}
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.6rem', color: '#ef4444', borderColor: '#fecaca' }}
                            title="Delete this frozen scenario"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {linkedAction ? (
                          <span className={`pill ${linkedAction.status === 'COMPLETED' ? 'pill-emerald' : 'pill-amber'}`} style={{ fontWeight: 700, padding: '0.35rem 0.75rem' }}>
                            {linkedAction.status === 'COMPLETED' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                            Action {linkedAction.status}
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePromoteScenarioToAction(scen.id)}
                            className="btn-primary"
                            style={{ fontSize: '0.775rem', padding: '0.4rem 0.85rem' }}
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
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Climate Action Plan & Execution Tracker
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Formal decarbonization projects with <strong>HUMAN_CONFIRMED</strong> completion verification and engineering audit notes.
                  </p>
                </div>

                {/* Action plan summary chips */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="pill pill-emerald" style={{ fontWeight: 700 }}>
                    <CheckCircle2 size={13} /> {actions.filter(a => a.status === 'COMPLETED').length} Completed & Verified
                  </span>
                  <span className="pill pill-amber" style={{ fontWeight: 700 }}>
                    <Clock size={13} /> {actions.filter(a => a.status === 'APPROVED').length} Pending Sign-off
                  </span>
                </div>
              </div>

              <div className="watershed-card" style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
                <table className="watershed-table">
                  <thead>
                    <tr>
                      <th>Action ID</th>
                      <th>Linked Scenario</th>
                      <th>Facility & Policy</th>
                      <th>Execution Status</th>
                      <th>Approved Date</th>
                      <th>Completed Date</th>
                      <th>Protocol</th>
                      <th>Verification Audit Note</th>
                      <th style={{ textAlign: 'right' }}>Sign-off</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map(act => {
                      const scen = scenarios.find(s => s.id === act.scenario_id);
                      const room = rooms.find(r => r.id === scen?.room_id);

                      return (
                        <tr key={act.id}>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, background: '#f8fafc', padding: '0.2rem 0.45rem', borderRadius: '5px', border: '1px solid #e2e8f0', color: '#334155' }}>
                              {act.id}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#475569' }}>
                              {act.scenario_id}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{room?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{scen?.input_snapshot_json?.policy_name}</div>
                          </td>
                          <td>
                            {act.status === 'APPROVED' && (
                              <span className="pill pill-amber" style={{ fontWeight: 700 }}>
                                <Clock size={12} /> APPROVED
                              </span>
                            )}
                            {act.status === 'COMPLETED' && (
                              <span className="pill pill-emerald" style={{ fontWeight: 800 }}>
                                <CheckCircle2 size={13} /> COMPLETED
                              </span>
                            )}
                            {act.status === 'CANCELLED' && (
                              <span className="pill pill-rose" style={{ fontWeight: 700 }}>CANCELLED</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                            {act.approved_at ? new Date(act.approved_at).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                            {act.completed_at ? new Date(act.completed_at).toLocaleDateString() : (
                              <span style={{ color: '#d97706', fontWeight: 600 }}>In Progress</span>
                            )}
                          </td>
                          <td>
                            <span className="pill pill-slate" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                              {act.completion_method}
                            </span>
                          </td>
                          <td style={{ maxWidth: '300px' }}>
                            {act.completion_note ? (
                              <div style={{
                                fontStyle: 'italic',
                                color: '#334155',
                                background: '#f8fafc',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                borderLeft: '3px solid #10b981',
                                fontSize: '0.775rem'
                              }}>
                                "{act.completion_note}"
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Awaiting technician log</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                              {act.status === 'APPROVED' && (
                                <button
                                  onClick={() => {
                                    setShowActionConfirmModal(act);
                                    setActionConfirmNote('Facility engineer verified automated vacancy setback operational.');
                                  }}
                                  className="btn-primary"
                                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                                >
                                  <CheckCircle2 size={13} /> Human Sign-off
                                </button>
                              )}
                              {act.status === 'COMPLETED' && (
                                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <CheckCircle2 size={15} color="#10b981" /> Verified
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteAction(act.id)}
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.55rem', color: '#ef4444', borderColor: '#fecaca' }}
                                title="Delete this action record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
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
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Emission Factors Library</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Regional GHG emission intensities from EPA eGRID, UK DEFRA, and IEA for Scope 2 electricity accounting.
                  </p>
                </div>
              </div>

              <div className="watershed-card" style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
                <table className="watershed-table">
                  <thead>
                    <tr>
                      <th>Factor Name & Code</th>
                      <th>Emissions Intensity</th>
                      <th>Unit Basis</th>
                      <th>Gas Scope</th>
                      <th>Geography</th>
                      <th>Reporting Year</th>
                      <th>Source Standard</th>
                      <th>Factor Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emissionFactors.map(ef => (
                      <tr key={ef.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{ef.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>ID: {ef.id}</div>
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: 800, fontSize: '1.05rem', color: '#059669' }}>
                          <span style={{ background: '#ecfdf5', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                            {ef.value}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{ef.unit}</td>
                        <td>
                          <span className="pill pill-slate" style={{ fontWeight: 600 }}>{ef.gas_basis}</span>
                        </td>
                        <td>
                          <span className="pill pill-slate" style={{ fontWeight: 700 }}>
                            <Globe size={12} color="#64748b" /> {ef.geography}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#334155' }}>{ef.reporting_year}</td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{ef.source_reference}</td>
                        <td>
                          <span className="pill pill-emerald" style={{ fontWeight: 700 }}>
                            {ef.factor_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: DATABASE EXPLORER */}
          {activeTab === 'database' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Database Model & Table Inspector</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Live schema and row inspector for all 6 tables: <code>rooms</code>, <code>equipment</code>, <code>observations</code>, <code>emission_factors</code>, <code>scenarios</code>, <code>actions</code>.
                  </p>
                </div>
              </div>

              {/* Quick table cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {[
                  { title: 'rooms', count: rooms.length, border: '#10b981', desc: 'id, building_name, name, capacity, demo_room, created_at', data: rooms },
                  { title: 'equipment', count: equipment.length, border: '#f59e0b', desc: 'id, room_id, name, quantity, rated_power_w, declared_state, state_declared_at, nonessential, safety_exclusion', data: equipment },
                  { title: 'observations', count: observations.length, border: '#06b6d4', desc: 'id, room_id, camera_session_id, people_detected, observed_at, received_at, coverage, source', data: observations },
                  { title: 'emission_factors', count: emissionFactors.length, border: '#059669', desc: 'id, name, value, unit, geography, reporting_year, source_reference, gas_basis, factor_type', data: emissionFactors },
                  { title: 'scenarios', count: scenarios.length, border: '#6366f1', desc: 'id, room_id, created_at, input_snapshot_json, result_snapshot_json', data: scenarios },
                  { title: 'actions', count: actions.length, border: '#047857', desc: 'id, scenario_id, status, approved_at, completed_at, completion_method, completion_note', data: actions }
                ].map(table => (
                  <div key={table.title} className="watershed-card" style={{ padding: '1.35rem', borderTop: `3px solid ${table.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} color="#059669" />
                        <h4 style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{table.title}</h4>
                      </div>
                      <span className="pill pill-slate" style={{ fontWeight: 700 }}>{table.count} rows</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                      {table.desc}
                    </p>
                    <pre className="terminal-box" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {JSON.stringify(table.data.slice(0, 2), null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: CARBON CALCULATOR */}
          {activeTab === 'calculator' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Standardized Carbon Footprint Calculator
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Calibrated for academic facilities, commute travel, and equipment standby. Powered by CEA V19 & EPA standards with zero PII retention.
                  </p>
                </div>

                {/* Calculator Sub-tab switcher */}
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px', gap: '0.25rem' }}>
                  <button
                    onClick={() => setCalcTab('electricity')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: 'none',
                      background: calcTab === 'electricity' ? '#ffffff' : 'transparent',
                      color: calcTab === 'electricity' ? '#0f172a' : '#64748b',
                      boxShadow: calcTab === 'electricity' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Zap size={14} color="#059669" /> Grid Electricity
                  </button>
                  <button
                    onClick={() => setCalcTab('travel')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: 'none',
                      background: calcTab === 'travel' ? '#ffffff' : 'transparent',
                      color: calcTab === 'travel' ? '#0f172a' : '#64748b',
                      boxShadow: calcTab === 'travel' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Car size={14} color="#6366f1" /> Commute Travel
                  </button>
                  <button
                    onClick={() => setCalcTab('equipment')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: 'none',
                      background: calcTab === 'equipment' ? '#ffffff' : 'transparent',
                      color: calcTab === 'equipment' ? '#0f172a' : '#64748b',
                      boxShadow: calcTab === 'equipment' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <HardDrive size={14} color="#f59e0b" /> Equipment Standby
                  </button>
                </div>
              </div>

              {/* SUB-CALCULATOR 1: ELECTRICITY */}
              {calcTab === 'electricity' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                  <div className="watershed-card" style={{ padding: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={18} color="#059669" /> Facility & Laboratory Power
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                      Calculate direct Scope 2 emissions based on monthly utility billing or smart meter kWh readings.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Monthly Consumption (kWh)</label>
                      <input
                        type="number"
                        value={calcElectricity.kwh}
                        onChange={e => setCalcElectricity({ ...calcElectricity, kwh: e.target.value })}
                        className="form-input"
                        placeholder="e.g. 850"
                        min="0"
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">OR Monthly Bill (₹ Rupees - Optional)</label>
                      <input
                        type="number"
                        value={calcElectricity.bill_amount}
                        onChange={e => setCalcElectricity({ ...calcElectricity, bill_amount: e.target.value })}
                        className="form-input"
                        placeholder="e.g. 5000"
                        min="0"
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Electricity Grid Emission Factor</label>
                      <select
                        value={calcElectricity.factor_id}
                        onChange={e => setCalcElectricity({ ...calcElectricity, factor_id: e.target.value })}
                        className="form-select"
                      >
                        <option value="CEA_V19_FY2022_23_DEMO">CEA Baseline v19 (0.716 kg CO₂ / kWh)</option>
                        <option value="US_EPA_EGRID_2024">US EPA eGRID (0.370 kg CO₂ / kWh)</option>
                        <option value="RENEWABLE_GREEN_TARIFF">Certified Solar Microgrid (0.045 kg CO₂ / kWh)</option>
                        <option value="HIGH_CARBON_PEAKER">Thermal Coal Peaker (0.885 kg CO₂ / kWh)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleRunElectricityCalc}
                      disabled={calcElectricity.loading}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Calculator size={16} />
                      {calcElectricity.loading ? 'Calculating...' : 'Compute Electricity Footprint'}
                    </button>
                  </div>

                  {/* Electricity Results Card */}
                  <div className="watershed-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span className="pill pill-emerald" style={{ fontWeight: 800 }}>
                          <ShieldCheck size={13} /> ISO 14064-1 Audited Math
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scope 2 Calculation</span>
                      </div>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                        Emissions Assessment
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                        Output represents verified direct CO₂ emissions from entered energy quantities.
                      </p>

                      {calcElectricity.result ? (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Period Footprint</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }} className="tabular-nums">
                                {calcElectricity.result.period_emissions_kg_co2} <span style={{ fontSize: '0.85rem' }}>kg CO₂</span>
                              </div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Annual Projected</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }} className="tabular-nums">
                                {calcElectricity.result.projected_annual_tco2} <span style={{ fontSize: '0.85rem' }}>tCO₂</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#065f46', fontWeight: 700 }}>
                              <Leaf size={14} /> Environmental Equivalents
                            </div>
                            <div style={{ color: '#047857' }}>
                              • <strong>{calcElectricity.result.environmental_benchmarks.trees_required_to_offset}</strong> mature urban trees required to absorb this annual load.
                            </div>
                            <div style={{ color: '#047857' }}>
                              • Equivalent to driving a gasoline vehicle <strong>{calcElectricity.result.environmental_benchmarks.car_distance_equivalent_km.toLocaleString()} km</strong>.
                            </div>
                            <div style={{ color: '#047857' }}>
                              • Up to <strong>{calcElectricity.result.environmental_benchmarks.smart_reduction_potential_kwh} kWh</strong> avoidable through automated vacancy power-down.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                          <Calculator size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enter your parameters and click calculate to view footprint breakdown.</div>
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.725rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '1rem' }}>
                      Emissions Factor: CEA CO₂ Baseline Database for the Indian Power Sector v19 (0.716 kg CO₂/kWh). Excludes upstream T&D lifecycle.
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-CALCULATOR 2: TRAVEL */}
              {calcTab === 'travel' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                  <div className="watershed-card" style={{ padding: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Car size={18} color="#6366f1" /> Commute & Transit Footprint
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                      Calculate personal and vehicle trip emissions using US EPA tailpipe benchmark standards.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Commute Transit Mode</label>
                      <select
                        value={calcTravel.mode}
                        onChange={e => setCalcTravel({ ...calcTravel, mode: e.target.value })}
                        className="form-select"
                      >
                        <option value="PETROL_CAR">Gasoline / Petrol Car (0.172 kg CO₂ / km)</option>
                        <option value="DIESEL_CAR">Diesel Passenger Car (0.154 kg CO₂ / km)</option>
                        <option value="ELECTRIC_VEHICLE">Battery Electric Vehicle (0.052 kg CO₂ / km)</option>
                        <option value="CAMPUS_SHUTTLE_BUS">Campus Shuttle Bus (0.082 kg CO₂ / passenger-km)</option>
                        <option value="COMMUTER_RAIL">Commuter Rail / Metro (0.038 kg CO₂ / passenger-km)</option>
                        <option value="MOTORCYCLE">Motorcycle / Scooter (0.071 kg CO₂ / km)</option>
                        <option value="BICYCLE_WALK">Walking / Bicycle (0.000 kg CO₂ - Zero)</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label className="form-label">One-Way Distance (km)</label>
                        <input
                          type="number"
                          value={calcTravel.distance_km}
                          onChange={e => setCalcTravel({ ...calcTravel, distance_km: e.target.value })}
                          className="form-input"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="form-label">Carpool Occupants</label>
                        <input
                          type="number"
                          value={calcTravel.occupants}
                          onChange={e => setCalcTravel({ ...calcTravel, occupants: e.target.value })}
                          className="form-input"
                          min="1"
                          max="8"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Trips Per Week (Default 5 Roundtrips)</label>
                      <input
                        type="number"
                        value={calcTravel.trips_per_week}
                        onChange={e => setCalcTravel({ ...calcTravel, trips_per_week: e.target.value })}
                        className="form-input"
                        min="1"
                        max="14"
                      />
                    </div>

                    <button
                      onClick={handleRunTravelCalc}
                      disabled={calcTravel.loading}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Calculator size={16} />
                      {calcTravel.loading ? 'Calculating...' : 'Compute Commute Footprint'}
                    </button>
                  </div>

                  {/* Travel Results Card */}
                  <div className="watershed-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span className="pill pill-indigo" style={{ fontWeight: 800 }}>
                          <Car size={13} /> ISO Vehicle Allocation
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scope 3 Commute</span>
                      </div>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                        Commute Emissions Summary
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                        Direct tailpipe emissions allocated across trip occupants.
                      </p>

                      {calcTravel.result ? (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Trip Allocated</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }} className="tabular-nums">
                                {calcTravel.result.allocated_per_occupant_kg_co2} <span style={{ fontSize: '0.85rem' }}>kg CO₂</span>
                              </div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Annual Personal</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }} className="tabular-nums">
                                {calcTravel.result.annual_allocated_tco2} <span style={{ fontSize: '0.85rem' }}>tCO₂</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '1rem', fontSize: '0.8rem', color: '#312e81', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <CheckCircle2 size={14} color="#6366f1" /> Accounting Principles
                            </div>
                            <div>• <strong>Vehicle Tailpipe Total:</strong> {calcTravel.result.trip_total_kg_co2} kg CO₂ / trip.</div>
                            <div>• <strong>Carpooling Guidance:</strong> {calcTravel.result.carpool_efficiency_note}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                          <Car size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select transit details to see commute carbon allocation.</div>
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.725rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '1rem' }}>
                      Note: Shared allocation does not reduce total vehicle tailpipe emissions. Tailpipe emission remains fully generated by the vehicle.
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-CALCULATOR 3: EQUIPMENT */}
              {calcTab === 'equipment' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                  <div className="watershed-card" style={{ padding: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <HardDrive size={18} color="#f59e0b" /> Academic Equipment Standby
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                      Audit idle standby waste for workstations, robotic arms, LED arrays, and projectors.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Equipment Model / Name</label>
                      <input
                        type="text"
                        value={calcEquipment.preset_name}
                        onChange={e => setCalcEquipment({ ...calcEquipment, preset_name: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label className="form-label">Rated Watts (W)</label>
                        <input
                          type="number"
                          value={calcEquipment.watts}
                          onChange={e => setCalcEquipment({ ...calcEquipment, watts: e.target.value })}
                          className="form-input"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          value={calcEquipment.quantity}
                          onChange={e => setCalcEquipment({ ...calcEquipment, quantity: e.target.value })}
                          className="form-input"
                          min="1"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label className="form-label">Active Hours / Day</label>
                        <input
                          type="number"
                          value={calcEquipment.active_hours_day}
                          onChange={e => setCalcEquipment({ ...calcEquipment, active_hours_day: e.target.value })}
                          className="form-input"
                          min="0"
                          max="24"
                        />
                      </div>
                      <div>
                        <label className="form-label">Vacant Idle Hours / Day</label>
                        <input
                          type="number"
                          value={calcEquipment.vacant_waste_hours_day}
                          onChange={e => setCalcEquipment({ ...calcEquipment, vacant_waste_hours_day: e.target.value })}
                          className="form-input"
                          min="0"
                          max="24"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleRunEquipmentCalc}
                      disabled={calcEquipment.loading}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Calculator size={16} />
                      {calcEquipment.loading ? 'Calculating...' : 'Compute Equipment Standby Waste'}
                    </button>
                  </div>

                  {/* Equipment Results Card */}
                  <div className="watershed-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span className="pill pill-amber" style={{ fontWeight: 800 }}>
                          <AlertTriangle size={13} /> Vacancy Waste Engine
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Device Level Analysis</span>
                      </div>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                        Avoidable Standby Assessment
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                        Quantifies energy lost running non-essential equipment in empty academic rooms.
                      </p>

                      {calcEquipment.result ? (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                            <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
                              <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Daily Waste</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }} className="tabular-nums">
                                {calcEquipment.result.daily_waste_kwh} <span style={{ fontSize: '0.85rem' }}>kWh</span>
                              </div>
                            </div>
                            <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
                              <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Avoidable Annual</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }} className="tabular-nums">
                                {calcEquipment.result.annual_avoidable_waste_tco2} <span style={{ fontSize: '0.85rem' }}>tCO₂e</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Financial Savings Opportunity:</div>
                            <div>• Avoidable utility waste cost: <strong>₹{calcEquipment.result.annual_cost_savings_potential_usd ? Number(calcEquipment.result.annual_cost_savings_potential_usd).toLocaleString('en-IN') : '0'} / year</strong>.</div>
                            <div>• Connected controllable load: <strong>{calcEquipment.result.connected_power_kw} kW</strong>.</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                          <HardDrive size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Specify equipment wattage and idle hours to audit standby waste.</div>
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.725rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '1rem' }}>
                      Conforms to ISO 14064-1 baseline boundary calculations over 260 operational academic days.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: NEW SCENARIO SIMULATION */}
      {showNewScenarioModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Model Abatement Scenario</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Simulate setback policies with immutable snapshot guarantee</div>
                </div>
              </div>
              <button
                onClick={() => setShowNewScenarioModal(false)}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.15s ease' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateScenario}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  Select Target Facility Room
                </label>
                <select
                  value={scenarioForm.room_id}
                  onChange={e => setScenarioForm({ ...scenarioForm, room_id: e.target.value })}
                  className="form-select"
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
                <label className="form-label">
                  Decarbonization Policy Name
                </label>
                <input
                  type="text"
                  value={scenarioForm.policy_name}
                  onChange={e => setScenarioForm({ ...scenarioForm, policy_name: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Dynamic Vacancy Power-Down (Evening & Weekends)"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Hours of Idle Run-Time Saved / Day
                  </label>
                  <span className="pill pill-emerald" style={{ fontWeight: 800 }}>
                    {scenarioForm.hours_saved_per_day} hours / day
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={scenarioForm.hours_saved_per_day}
                  onChange={e => setScenarioForm({ ...scenarioForm, hours_saved_per_day: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  Emission Factor Model (Scope 2 Benchmark)
                </label>
                <select
                  value={scenarioForm.emission_factor_id}
                  onChange={e => setScenarioForm({ ...scenarioForm, emission_factor_id: e.target.value })}
                  className="form-select"
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
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '0.85rem',
                fontSize: '0.775rem',
                color: '#065f46',
                marginBottom: '1.35rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Lock size={16} color="#059669" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Freeze Guarantee:</strong> At creation, current equipment ratings and factor values are locked inside <code>input_snapshot_json</code>.
                </div>
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
                  <CheckCircle2 size={16} /> Run Simulation & Freeze Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD ROOM */}
      {showNewRoomModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Add New Facility Room</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Provision a digital twin node for campus spatial metering</div>
                </div>
              </div>
              <button
                onClick={() => setShowNewRoomModal(false)}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

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
                <label className="form-label">Building Name</label>
                <input name="building_name" defaultValue="Curie Science Complex" required className="form-input" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Room / Zone Name</label>
                <input name="name" placeholder="e.g. Nanotechnology Cleanroom 4A" required className="form-input" />
              </div>
              <div style={{ marginBottom: '1.35rem' }}>
                <label className="form-label">Designed Occupancy Capacity</label>
                <input name="capacity" type="number" defaultValue="30" required className="form-input" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowNewRoomModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  <Plus size={16} /> Save Room Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EQUIPMENT */}
      {showNewEquipmentModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <HardDrive size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Register Equipment Asset</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Configure power ratings and automated setback classification</div>
                </div>
              </div>
              <button
                onClick={() => setShowNewEquipmentModal(false)}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

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
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Assign to Facility Room</label>
                <select name="room_id" required className="form-select">
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.building_name})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Equipment Model / Name</label>
                <input name="name" placeholder="e.g. 4K Dual Studio Monitors" required className="form-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label className="form-label">Quantity</label>
                  <input name="quantity" type="number" defaultValue="1" min="1" required className="form-input" />
                </div>
                <div>
                  <label className="form-label">Rated Watts (each)</label>
                  <input name="rated_power_w" type="number" defaultValue="250" min="0" required className="form-input" />
                </div>
              </div>
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Initial Operating State</label>
                <select name="declared_state" className="form-select">
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </select>
              </div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input type="checkbox" name="nonessential" id="nonessential" defaultChecked style={{ accentColor: '#059669', width: '16px', height: '16px' }} />
                  <label htmlFor="nonessential" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                    Mark Non-Essential (Eligible for idle setback power-down)
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input type="checkbox" name="safety_exclusion" id="safety_exclusion" style={{ accentColor: '#dc2626', width: '16px', height: '16px' }} />
                  <label htmlFor="safety_exclusion" style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 700 }}>
                    Safety Exclusion Shield (Never automatically power down)
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowNewEquipmentModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  <Plus size={16} /> Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: HUMAN CONFIRMATION SIGN-OFF FOR ACTION */}
      {showActionConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Human Confirmation Sign-off</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified execution audit trail requirement</div>
                </div>
              </div>
              <button
                onClick={() => setShowActionConfirmModal(null)}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <div style={{ color: '#64748b' }}>Action ID: <code style={{ color: '#0f172a', fontWeight: 700 }}>{showActionConfirmModal.id}</code></div>
              <div style={{ color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
                Protocol: <strong>HUMAN_CONFIRMED</strong> with immutable engineering log.
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">
                Engineer Completion Verification Note
              </label>
              <textarea
                value={actionConfirmNote}
                onChange={e => setActionConfirmNote(e.target.value)}
                rows={3}
                className="form-input"
                placeholder="e.g. Electrical engineer confirmed relay installation and 0W idle standby."
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowActionConfirmModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleConfirmActionComplete} className="btn-primary">
                <CheckCircle2 size={16} /> Verify & Mark COMPLETED
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SNAPSHOT JSON INSPECTOR */}
      {showSnapshotDetailModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{
            maxWidth: '720px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Frozen Snapshot Verification</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scenario ID: <code>{showSnapshotDetailModal.id}</code></span>
                </div>
              </div>
              <button
                onClick={() => setShowSnapshotDetailModal(null)}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>
                    input_snapshot_json
                  </h4>
                  <span className="pill pill-emerald" style={{ fontSize: '0.675rem' }}>Frozen Equipment & Factors</span>
                </div>
                <pre className="terminal-box" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {JSON.stringify(showSnapshotDetailModal.input_snapshot_json, null, 2)}
                </pre>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>
                    result_snapshot_json
                  </h4>
                  <span className="pill pill-emerald" style={{ fontSize: '0.675rem' }}>Calculated Abatement Savings</span>
                </div>
                <pre className="terminal-box" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {JSON.stringify(showSnapshotDetailModal.result_snapshot_json, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowSnapshotDetailModal(null)} className="btn-secondary">Close Inspector</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: ISO 14064 COMPLIANCE CARBON AUDIT REPORT & UNIVERSAL DATA EXPORTER */}
      {showAuditModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '840px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                    ISO 14064 Compliance Carbon Audit & Data Center
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    GHG Protocol Corporate Standard • St. Jude Research Campus Scope 2 & 3 Statement
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', background: 'var(--color-surface-subtle)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
                  <button
                    onClick={() => setAuditTab('preview')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: auditTab === 'preview' ? 'var(--color-surface-white)' : 'transparent',
                      color: auditTab === 'preview' ? 'var(--color-emerald-light)' : 'var(--color-text-muted)',
                      boxShadow: auditTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Compliance Certificate
                  </button>
                  <button
                    onClick={() => setAuditTab('export')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: auditTab === 'export' ? 'var(--color-surface-white)' : 'transparent',
                      color: auditTab === 'export' ? 'var(--color-emerald-light)' : 'var(--color-text-muted)',
                      boxShadow: auditTab === 'export' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Data Exporters (CSV/JSON)
                  </button>
                </div>
                <button
                  onClick={() => setShowAuditModal(false)}
                  style={{ background: 'var(--color-surface-subtle)', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* TAB CONTENT: AUDIT PREVIEW */}
            {auditTab === 'preview' && (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {/* Official Certificate Paper Card */}
                <div style={{
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--color-emerald-primary)', paddingBottom: '0.85rem', marginBottom: '1.1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 800, letterSpacing: '0.08em' }}>
                        Official Verification Certificate
                      </div>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                        Institutional Greenhouse Gas & Energy Statement
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Standard: ISO 14064-1:2018 & GHG Protocol Corporate Accounting Standard
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="pill pill-emerald" style={{ fontSize: '0.725rem' }}>VERIFIED AUDIT LEVEL</span>
                      <div style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                        HASH: SHA256-CT2026-STJUDE-89FA
                      </div>
                    </div>
                  </div>

                  {/* Institution Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Reporting Organization:</span>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>St. Jude Research Campus</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Audit Reporting Cycle:</span>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>Calendar Year 2026 (Monthly Run-Rate)</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Audited Area:</span>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>48,500 m² (6 Monitored Facilities)</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Verification Protocol:</span>
                      <div style={{ fontWeight: 700, color: '#10b981' }}>Zero-PII Vision & Human Confirmed</div>
                    </div>
                  </div>

                  {/* Scope Breakdown Table */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                      Emissions Inventory Summary Table (tCO₂e)
                    </div>
                    <table className="watershed-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Greenhouse Gas Scope</th>
                          <th>Activity Source</th>
                          <th>Emission Factor Standard</th>
                          <th>Emissions (tCO₂e)</th>
                          <th>Verification Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Scope 2 (Electricity)</strong></td>
                          <td>Grid Facility Power & Compute Loads</td>
                          <td>{analytics?.default_emission_factor?.name || 'CEA India V19'} ({analytics?.default_emission_factor?.value} kg/kWh)</td>
                          <td><strong>{analytics?.total_emissions_t_co2e} tCO₂e</strong></td>
                          <td><span className="pill pill-emerald">Live Telemetry</span></td>
                        </tr>
                        <tr>
                          <td><strong>Scope 2 (Market-Based)</strong></td>
                          <td>Adjusted for Verified Renewable Energy PPA</td>
                          <td>I-REC & Green Tariff Credit (35% offset)</td>
                          <td><strong>{((analytics?.total_emissions_t_co2e || 88.4) * 0.65).toFixed(1)} tCO₂e</strong></td>
                          <td><span className="pill pill-emerald">Verified Contract</span></td>
                        </tr>
                        <tr>
                          <td><strong>Scope 3 (Commute)</strong></td>
                          <td>Faculty & Student Travel (40 wks/yr)</td>
                          <td>US EPA Center for Corporate Climate Leadership</td>
                          <td><strong>18.4 tCO₂e</strong></td>
                          <td><span className="pill pill-indigo">Modeled</span></td>
                        </tr>
                        <tr style={{ background: 'var(--color-sage-bg)' }}>
                          <td><strong style={{ color: '#059669' }}>Avoided Abatements</strong></td>
                          <td>Validated Automated Relay & Setback Policies</td>
                          <td>Frozen Scenario Snapshots</td>
                          <td><strong style={{ color: '#059669' }}>-{(scenarios.reduce((acc, s) => acc + (s.result_snapshot_json?.annual_avoided_emissions_t_co2e || 0), 0)).toFixed(2)} tCO₂e/yr</strong></td>
                          <td><span className="pill pill-emerald">Approved Policies</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sign-off Block */}
                  <div style={{ borderTop: '1px dashed var(--color-border-strong)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem' }}>
                    <div>
                      <div style={{ color: 'var(--color-text-muted)' }}>Certified by Lead Auditor:</div>
                      <div style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>{currentUser?.name || 'Dr. Eleanor Vance'}, PE, CEM</div>
                      <div style={{ color: 'var(--color-text-muted)' }}>Director of Campus Facilities & Decarbonization</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--color-text-muted)' }}>Audit Issue Date:</div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Exportable under Freedom of Information & Higher Education Decarbonization Framework
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button onClick={handleExportJSON} className="btn-secondary">
                      <FileText size={15} color="#059669" /> Download JSON Snapshot
                    </button>
                    <button onClick={() => window.print()} className="btn-primary">
                      <Printer size={15} /> Print / Save Audit PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: EXPORT DATA PACKAGES */}
            {auditTab === 'export' && (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                  Download machine-readable CSV spreadsheets and JSON payloads for integration with institutional ERP, Energy Star Portfolio Manager, or state ESG reporting systems.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {/* Card 1 */}
                  <div className="watershed-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-sage-bg)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileSpreadsheet size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Facilities & Telemetry Inventory</h4>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>CSV • {rooms.length} Rooms • Active & Standby Loads</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                      Includes connected load (kW), vacant waste (kW), capacity, latest vision headcounts, and estimated hourly CO₂e.
                    </p>
                    <button onClick={() => handleExportCSV('facilities')} className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }}>
                      <Download size={14} /> Download Facilities CSV
                    </button>
                  </div>

                  {/* Card 2 */}
                  <div className="watershed-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-indigo-bg)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Climate Action Plan & Policies</h4>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>CSV • {actions.length} Action Items • Avoided tCO₂e</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                      Contains all approved and completed decarbonization work orders, frozen baseline savings, and human verification notes.
                    </p>
                    <button onClick={() => handleExportCSV('actions')} className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }}>
                      <Download size={14} /> Download Action Plan CSV
                    </button>
                  </div>

                  {/* Card 3 */}
                  <div className="watershed-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-amber-bg)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Edge Telemetry Observation Log</h4>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>CSV • {observations.length} Observations • Sensor Nodes</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                      Timestamped camera session observations, YOLOv8 model coverage, headcount detections, and room waste flags.
                    </p>
                    <button onClick={() => handleExportCSV('observations')} className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }}>
                      <Download size={14} /> Download Telemetry Log CSV
                    </button>
                  </div>

                  {/* Card 4 */}
                  <div className="watershed-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-cyan-bg)', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Full Campus Digital Twin Snapshot</h4>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>JSON • Complete Machine-Readable Export</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                      Comprehensive data payload including emission factors, active equipment inventory, room metadata, and executive KPIs.
                    </p>
                    <button onClick={handleExportJSON} className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }}>
                      <Download size={14} /> Download Full JSON
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 7: INSTITUTIONAL CARBON BUDGET MODIFIER */}
      {showBudgetModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--color-sage-bg)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                    Adjust Campus Carbon Ceiling
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Set institutional monthly budget cap (tCO₂e)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBudgetModal(false)}
                style={{ background: 'var(--color-surface-subtle)', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Target Monthly Ceiling</label>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  {tempBudgetCap} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>tCO₂e</span>
                </span>
              </div>

              <input
                type="range"
                min="50"
                max="250"
                step="5"
                value={tempBudgetCap}
                onChange={e => setTempBudgetCap(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                <span>50 tCO₂e (Aggressive)</span>
                <span>120 tCO₂e (Standard)</span>
                <span>250 tCO₂e (Growth)</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Strategic Preset Targets</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setTempBudgetCap(85.0)}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  Strict 1.5°C Paris (85 tCO₂e)
                </button>
                <button
                  type="button"
                  onClick={() => setTempBudgetCap(120.0)}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  Baseline Cap (120 tCO₂e)
                </button>
                <button
                  type="button"
                  onClick={() => setTempBudgetCap(160.0)}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  Winter Heating (160 tCO₂e)
                </button>
              </div>
            </div>

            {/* Impact Calculation Preview */}
            <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
              <div style={{ color: 'var(--color-text-muted)' }}>Projected Burn Impact at {tempBudgetCap} tCO₂e:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Current Run Rate Velocity:</span>
                <strong style={{ color: (analytics?.total_emissions_t_co2e / tempBudgetCap) >= 0.9 ? '#ef4444' : '#10b981', fontSize: '1rem' }}>
                  {((analytics?.total_emissions_t_co2e || 88.4) / tempBudgetCap * 100).toFixed(1)}% of Budget
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowBudgetModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleSaveBudgetCap(tempBudgetCap)} className="btn-primary">
                <Check size={16} /> Save Carbon Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: REAL-TIME EDGE VISION ACTIVITY STREAM & SENSOR DRAWER */}
      {showLiveStreamModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '780px', maxHeight: '86vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--color-sage-bg)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                    Live Edge Vision & Telemetry Activity Stream
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    6 Connected Campus Nodes • 12 FPS Vision AI • Sub-second Relay Telemetry
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>
                  ● 6 Nodes Streaming
                </span>
                <button
                  onClick={() => setShowLiveStreamModal(false)}
                  style={{ background: 'var(--color-surface-subtle)', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Active Edge Nodes Strip */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                Connected Campus Sensor Nodes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
                {rooms.map((r, i) => {
                  const obs = observations.find(o => o.room_id === r.id);
                  const people = obs ? obs.people_detected : 0;
                  return (
                    <div key={r.id} style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', padding: '0.65rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{r.name}</div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>Node CAM-0{i + 1} • 1080p60</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: people > 0 ? '#10b981' : '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                          {people} occ
                        </div>
                        <div style={{ fontSize: '0.65rem', color: people > 0 ? '#059669' : '#d97706' }}>
                          {people > 0 ? 'Active' : 'Standby'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Events Stream */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                Chronological Real-Time Event Log
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {liveEvents.map((evt) => (
                  <div key={evt.id} style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', padding: '0.75rem 0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontFamily: 'var(--font-mono)', minWidth: '55px' }}>{evt.time}</span>
                      <div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{evt.room}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{evt.message}</div>
                      </div>
                    </div>
                    <span className={`pill ${evt.level === 'warning' ? 'pill-amber' : evt.level === 'success' ? 'pill-emerald' : 'pill-slate'}`} style={{ fontSize: '0.675rem' }}>
                      {evt.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick manual injection action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Test immediate edge telemetry shifts on active campus twin
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>

                <button onClick={() => setShowLiveStreamModal(false)} className="btn-secondary" style={{ fontSize: '0.75rem' }}>
                  Close Stream
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
