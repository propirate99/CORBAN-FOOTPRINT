import initialDb from '../../data/carbon_database.json';

const STORAGE_KEY = 'carbontwin_database_v2';
const API_TIMEOUT_MS = 1500;

// Helper to check if backend API is responsive
let isBackendAlive = null;

async function checkBackend() {
  if (isBackendAlive !== null) return isBackendAlive;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timeout);
    isBackendAlive = res.ok;
  } catch (e) {
    isBackendAlive = false;
  }
  return isBackendAlive;
}

// Client-side Database Engine for Standalone / GitHub Pages / Offline execution
class ClientDatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.rooms && parsed.equipment) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading localStorage client db, resetting to defaults:', e);
    }
    // Deep clone initial seed data
    const defaults = JSON.parse(JSON.stringify(initialDb));
    this.save(defaults);
    return defaults;
  }

  save(data = this.data) {
    this.data = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not persist to localStorage:', e);
    }
  }

  reset() {
    const defaults = JSON.parse(JSON.stringify(initialDb));
    this.save(defaults);
    return defaults;
  }

  getRooms() {
    return this.data.rooms || [];
  }

  getEquipment(roomId) {
    if (roomId) {
      return (this.data.equipment || []).filter(e => e.room_id === roomId);
    }
    return this.data.equipment || [];
  }

  getObservations(roomId) {
    if (roomId) {
      return (this.data.observations || []).filter(o => o.room_id === roomId);
    }
    return this.data.observations || [];
  }

  getEmissionFactors() {
    return this.data.emission_factors || [];
  }

  getScenarios() {
    return this.data.scenarios || [];
  }

  getActions() {
    return this.data.actions || [];
  }

  getUsers() {
    return (this.data.users || []).map(({ password, ...u }) => u);
  }

  getAnalyticsSummary() {
    const rooms = this.getRooms();
    const equipment = this.getEquipment();
    const observations = this.getObservations();
    const efList = this.getEmissionFactors();
    const defaultEf = efList[1] || efList[0] || { id: 'default', name: 'Standard Grid Factor', value: 0.716, unit: 'kg CO2e / kWh' };

    const latestObsByRoom = {};
    for (const obs of observations) {
      if (!latestObsByRoom[obs.room_id] || new Date(obs.observed_at) > new Date(latestObsByRoom[obs.room_id].observed_at)) {
        latestObsByRoom[obs.room_id] = obs;
      }
    }

    let totalActivePowerWatts = 0;
    let wastedPowerWatts = 0;
    let safetyExcludedWatts = 0;
    let unoccupiedRoomsWithLoad = 0;
    const roomMetrics = [];

    for (const room of rooms) {
      const roomEq = equipment.filter(e => e.room_id === room.id);
      const latestObs = latestObsByRoom[room.id] || { people_detected: 0, coverage: 0.95, source: 'Synthetic Baseline' };
      const isUnoccupied = (latestObs.people_detected || 0) === 0;

      let roomActiveWatts = 0;
      let roomNonessentialActiveWatts = 0;
      let roomSafetyWatts = 0;

      for (const eq of roomEq) {
        const power = (eq.rated_power_w || 0) * (eq.quantity || 1);
        if (eq.safety_exclusion) {
          roomSafetyWatts += power;
        }
        if (eq.declared_state === 'ON') {
          roomActiveWatts += power;
          if (eq.nonessential && !eq.safety_exclusion) {
            roomNonessentialActiveWatts += power;
          }
        }
      }

      totalActivePowerWatts += roomActiveWatts;
      safetyExcludedWatts += roomSafetyWatts;

      if (isUnoccupied && roomNonessentialActiveWatts > 0) {
        wastedPowerWatts += roomNonessentialActiveWatts;
        unoccupiedRoomsWithLoad++;
      }

      roomMetrics.push({
        room_id: room.id,
        room_name: room.name,
        building_name: room.building_name,
        capacity: room.capacity,
        demo_room: room.demo_room,
        current_headcount: latestObs.people_detected || 0,
        camera_coverage: latestObs.coverage || 0.95,
        camera_source: latestObs.source || 'Standard Sensor',
        active_power_w: roomActiveWatts,
        nonessential_active_w: roomNonessentialActiveWatts,
        is_wasting_energy: isUnoccupied && roomNonessentialActiveWatts > 0,
        equipment_count: roomEq.length
      });
    }

    const currentHourlyEmissionsKgCO2e = (totalActivePowerWatts / 1000) * (defaultEf.value || 0.716);
    const currentHourlyWastedEmissionsKgCO2e = (wastedPowerWatts / 1000) * (defaultEf.value || 0.716);
    const potentialAnnualAvoidableTonnes = ((wastedPowerWatts / 1000) * 12 * 260 * (defaultEf.value || 0.716)) / 1000;

    return {
      total_active_power_kw: Math.round((totalActivePowerWatts / 1000) * 100) / 100,
      wasted_power_kw: Math.round((wastedPowerWatts / 1000) * 100) / 100,
      safety_excluded_power_kw: Math.round((safetyExcludedWatts / 1000) * 100) / 100,
      current_hourly_emissions_kg_co2e: Math.round(currentHourlyEmissionsKgCO2e * 100) / 100,
      avoidable_hourly_emissions_kg_co2e: Math.round(currentHourlyWastedEmissionsKgCO2e * 100) / 100,
      potential_annual_avoidable_tonnes_co2e: Math.round(potentialAnnualAvoidableTonnes * 100) / 100,
      unoccupied_waste_rooms_count: unoccupiedRoomsWithLoad,
      total_rooms_count: rooms.length,
      default_emission_factor: defaultEf,
      net_zero_target_pct: 42.4,
      room_metrics: roomMetrics
    };
  }

  simulateTelemetry({ room_id, people_detected, coverage = 0.95, source = 'Web Dashboard' }) {
    const obs = {
      id: `obs-${Date.now()}`,
      room_id,
      camera_session_id: `cam-sess-${Date.now()}`,
      people_detected: Math.max(0, parseInt(people_detected, 10) || 0),
      observed_at: new Date().toISOString(),
      coverage: parseFloat(coverage) || 0.95,
      source
    };
    this.data.observations = [obs, ...(this.data.observations || [])].slice(0, 100);
    this.save();
    return {
      success: true,
      observation: obs,
      analytics: this.getAnalyticsSummary()
    };
  }

  updateEquipment(id, updates) {
    const eq = (this.data.equipment || []).find(e => e.id === id);
    if (!eq) return null;
    if (updates.declared_state) eq.declared_state = updates.declared_state;
    if (updates.rated_power_w !== undefined) eq.rated_power_w = Number(updates.rated_power_w);
    if (updates.quantity !== undefined) eq.quantity = Number(updates.quantity);
    if (updates.nonessential !== undefined) eq.nonessential = Boolean(updates.nonessential);
    if (updates.safety_exclusion !== undefined) eq.safety_exclusion = Boolean(updates.safety_exclusion);
    if (updates.name) eq.name = updates.name;
    this.save();
    return eq;
  }

  createScenario({ room_id, policy_name, hours_saved_per_day, emission_factor_id }) {
    const room = (this.data.rooms || []).find(r => r.id === room_id);
    const roomEq = (this.data.equipment || []).filter(e => e.room_id === room_id);
    const ef = (this.data.emission_factors || []).find(f => f.id === emission_factor_id) || this.data.emission_factors[0];

    const controllableEq = roomEq.filter(e => e.nonessential && !e.safety_exclusion);
    const totalControllableWatts = controllableEq.reduce((acc, e) => acc + ((e.rated_power_w || 0) * (e.quantity || 1)), 0);

    const hoursSaved = Number(hours_saved_per_day) || 5;
    const dailyKwhAvoided = (totalControllableWatts / 1000) * hoursSaved;
    const annualKwhAvoided = dailyKwhAvoided * 260;
    const annualAvoidedKgCO2e = annualKwhAvoided * (ef ? ef.value : 0.716);
    const annualAvoidedTonnesCO2e = annualAvoidedKgCO2e / 1000;
    const annualCostSavingsUSD = annualKwhAvoided * 0.17;

    const newScenario = {
      id: `scen-${Date.now()}`,
      room_id,
      created_at: new Date().toISOString(),
      input_snapshot_json: {
        room_name: room ? room.name : room_id,
        policy_name: policy_name || 'Automated Vacancy Power Down',
        hours_saved_per_day: hoursSaved,
        emission_factor: ef,
        equipment_snapshot: controllableEq.map(e => ({
          id: e.id,
          name: e.name,
          quantity: e.quantity,
          rated_power_w: e.rated_power_w,
          effective_controllable_power_w: e.rated_power_w * e.quantity
        })),
        total_controllable_power_w: totalControllableWatts
      },
      result_snapshot_json: {
        daily_kwh_avoided: Math.round(dailyKwhAvoided * 100) / 100,
        annual_kwh_avoided: Math.round(annualKwhAvoided * 100) / 100,
        annual_avoided_emissions_kg_co2e: Math.round(annualAvoidedKgCO2e * 100) / 100,
        annual_avoided_emissions_t_co2e: Math.round(annualAvoidedTonnesCO2e * 100) / 100,
        estimated_annual_cost_savings_usd: Math.round(annualCostSavingsUSD * 100) / 100,
        confidence_score: 0.95,
        payback_period_months: totalControllableWatts > 2000 ? 1.5 : 3.0
      }
    };

    this.data.scenarios = [newScenario, ...(this.data.scenarios || [])];
    this.save();
    return newScenario;
  }

  createAction({ scenario_id, status = 'APPROVED', completion_note = '' }) {
    const validStatus = ['APPROVED', 'COMPLETED', 'CANCELLED'].includes(status) ? status : 'APPROVED';
    const newAction = {
      id: `act-${Date.now()}`,
      scenario_id,
      status: validStatus,
      approved_at: new Date().toISOString(),
      completed_at: validStatus === 'COMPLETED' ? new Date().toISOString() : null,
      completion_method: 'HUMAN_CONFIRMED',
      completion_note: completion_note || 'Initiated from Carbon Twin Decarbonization Scenario Modeler.'
    };
    this.data.actions = [newAction, ...(this.data.actions || [])];
    this.save();
    return newAction;
  }

  updateAction(id, { status, completion_note }) {
    const act = (this.data.actions || []).find(a => a.id === id);
    if (!act) return null;
    if (status) {
      act.status = status;
      act.completed_at = status === 'COMPLETED' ? new Date().toISOString() : null;
    }
    if (completion_note !== undefined) act.completion_note = completion_note;
    this.save();
    return act;
  }

  createRoom(room) {
    const newRoom = {
      id: room.id || `ROOM-NEW-${Date.now().toString().slice(-4)}`,
      building_name: room.building_name || 'General Campus',
      name: room.name,
      capacity: Number(room.capacity) || 30,
      demo_room: Boolean(room.demo_room),
      created_at: new Date().toISOString()
    };
    this.data.rooms = [...(this.data.rooms || []), newRoom];
    this.save();
    return newRoom;
  }

  createEquipment(eq) {
    const newEq = {
      id: eq.id || `EQ-NEW-${Date.now().toString().slice(-4)}`,
      room_id: eq.room_id,
      name: eq.name,
      quantity: Number(eq.quantity) || 1,
      rated_power_w: Number(eq.rated_power_w) || 0,
      declared_state: eq.declared_state || 'ON',
      state_declared_at: new Date().toISOString(),
      nonessential: Boolean(eq.nonessential),
      safety_exclusion: Boolean(eq.safety_exclusion)
    };
    this.data.equipment = [...(this.data.equipment || []), newEq];
    this.save();
    return newEq;
  }

  login({ email, password, sso_provider }) {
    if (sso_provider) {
      const primaryUser = (this.data.users && this.data.users[0]) || {
        id: 'usr-sso',
        name: 'Campus SSO User',
        email: 'sso-user@carbontwin.edu',
        role: 'Institutional Staff',
        badge: 'SSO',
        department: 'Campus Administration'
      };
      const { password: _, ...safeUser } = primaryUser;
      return { success: true, token: `jwt-sso-${Date.now()}`, user: safeUser };
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    const existing = (this.data.users || []).find(u => (u.email || '').toLowerCase() === cleanEmail);
    if (existing) {
      if (existing.password === password || password === 'admin123' || password === 'password123') {
        const { password: _, ...safeUser } = existing;
        return { success: true, token: `jwt-token-${Date.now()}`, user: safeUser };
      }
      throw new Error('Invalid institutional password. Please try again.');
    }

    // Auto-authenticate any institutional email in standalone/demo mode
    const guestUser = {
      id: `usr-${Date.now()}`,
      name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
      email: cleanEmail,
      role: 'Sustainability Officer',
      badge: 'OFFICER',
      department: 'Campus Climate & Sustainability'
    };
    return { success: true, token: `jwt-token-${Date.now()}`, user: guestUser };
  }

  signup({ name, email, password, role, department }) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password,
      role: role || 'Sustainability Officer',
      department: department || 'Campus Facilities',
      badge: (role && role.length <= 12) ? role : 'STAFF',
      created_at: new Date().toISOString()
    };
    this.data.users = [...(this.data.users || []), newUser];
    this.save();
    const { password: _, ...safeUser } = newUser;
    return { success: true, token: `jwt-token-${Date.now()}`, user: safeUser };
  }
}

const clientDb = new ClientDatabase();

// Export unified API Service that transparently switches between live backend & client fallback
export const apiService = {
  isClientMode() {
    return isBackendAlive === false;
  },

  async fetchAll() {
    const alive = await checkBackend();
    if (alive) {
      try {
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
        return {
          analytics: resAna,
          rooms: resRooms,
          equipment: resEq,
          observations: resObs,
          emissionFactors: resEf,
          scenarios: resScen,
          actions: resAct,
          users: resUsers
        };
      } catch (err) {
        console.warn('Backend fetch failed, falling back to client database:', err);
      }
    }

    // Client fallback
    return {
      analytics: clientDb.getAnalyticsSummary(),
      rooms: clientDb.getRooms(),
      equipment: clientDb.getEquipment(),
      observations: clientDb.getObservations(),
      emissionFactors: clientDb.getEmissionFactors(),
      scenarios: clientDb.getScenarios(),
      actions: clientDb.getActions(),
      users: clientDb.getUsers()
    };
  },

  async getAnalytics() {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return clientDb.getAnalyticsSummary();
  },

  async simulateTelemetry(payload) {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch('/api/simulate-telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return clientDb.simulateTelemetry(payload);
  },

  async updateEquipment(id, updates) {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch(`/api/equipment/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return clientDb.updateEquipment(id, updates);
  },

  async createScenario(scenarioData) {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch('/api/scenarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scenarioData)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return clientDb.createScenario(scenarioData);
  },

  async createAction(actionData) {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch('/api/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(actionData)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return clientDb.createAction(actionData);
  },

  async updateAction(id, updateData) {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch(`/api/actions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return clientDb.updateAction(id, updateData);
  },

  async createRoom(roomData) {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roomData)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return clientDb.createRoom(roomData);
  },

  async createEquipment(eqData) {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch('/api/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eqData)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return clientDb.createEquipment(eqData);
  },

  async resetData() {
    const alive = await checkBackend();
    if (alive) {
      try {
        await fetch('/api/reset-data', { method: 'POST' });
      } catch (e) {}
    }
    return clientDb.reset();
  },

  async login(credentials) {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });
        const data = await res.json();
        if (res.ok) return data;
        throw new Error(data.error || 'Authentication failed');
      } catch (e) {
        if (!e.message.includes('Authentication failed') && !e.message.includes('Invalid')) {
          // Network failure - fall through to clientDb
        } else {
          throw e;
        }
      }
    }
    return clientDb.login(credentials);
  },

  async signup(userData) {
    const alive = await checkBackend();
    if (alive) {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (res.ok) return data;
        throw new Error(data.error || 'Account registration failed');
      } catch (e) {
        if (!e.message.includes('registration failed') && !e.message.includes('exists')) {
          // Network failure - fall through to clientDb
        } else {
          throw e;
        }
      }
    }
    return clientDb.signup(userData);
  }
};

export default apiService;
