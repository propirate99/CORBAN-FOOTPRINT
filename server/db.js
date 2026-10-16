const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'carbon_database.json');
const LEGACY_DB_FILE = path.join(__dirname, '..', 'data', 'watershed_database.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial seed data adhering strictly to the custom Carbon Database schema
let defaultData;
try {
  defaultData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
} catch (e) {
  try {
    defaultData = JSON.parse(fs.readFileSync(LEGACY_DB_FILE, 'utf8'));
  } catch (err) {
    defaultData = { rooms: [], equipment: [], observations: [], emission_factors: [], scenarios: [], actions: [], users: [] };
  }
}

// Privacy policy validation: explicitly block prohibited telemetry
const PROHIBITED_KEYS = [
  'student_name', 'student_names', 'student_id', 'student_ids',
  'name_student', 'health_record', 'health_records', 'medical',
  'face_embedding', 'face_embeddings', 'biometric', 'face_vector',
  'location_history', 'continuous_location', 'gps_track', 'track_history'
];

function sanitizeCheck(data) {
  const jsonStr = JSON.stringify(data).toLowerCase();
  for (const forbidden of PROHIBITED_KEYS) {
    if (jsonStr.includes(`"${forbidden}"`) || jsonStr.includes(forbidden)) {
      throw new Error(`Privacy Violation: Data contains prohibited field '${forbidden}'. FERPA & Privacy policy strictly prohibits student names, health records, face embeddings, or continuous location histories.`);
    }
  }
}

class Database {
  constructor() {
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure legacy file is also synced with custom carbon database
        try { fs.writeFileSync(LEGACY_DB_FILE, raw, 'utf8'); } catch (err) {}
      } else if (fs.existsSync(LEGACY_DB_FILE)) {
        const raw = fs.readFileSync(LEGACY_DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        this.save();
      } else {
        this.data = JSON.parse(JSON.stringify(defaultData));
        this.save();
      }
    } catch (e) {
      console.error('Error loading Carbon Database, initializing default data:', e);
      this.data = JSON.parse(JSON.stringify(defaultData));
      this.save();
    }

    // Ensure users array exists
    if (!this.data.users || !Array.isArray(this.data.users) || this.data.users.length === 0) {
      this.data.users = JSON.parse(JSON.stringify(defaultData.users || []));
      this.save();
    }

    // Purge any legacy demo entries from active storage
    let modified = false;
    if (this.data.rooms) {
      const before = this.data.rooms.length;
      this.data.rooms = this.data.rooms.filter(r => r.id !== 'room-demo' && !r.demo_room);
      if (this.data.rooms.length !== before) modified = true;
    }
    if (this.data.equipment) {
      const before = this.data.equipment.length;
      this.data.equipment = this.data.equipment.filter(e => e.room_id !== 'room-demo' && !e.id.startsWith('eq-demo'));
      if (this.data.equipment.length !== before) modified = true;
    }
    if (this.data.observations) {
      const before = this.data.observations.length;
      this.data.observations = this.data.observations.filter(o => o.room_id !== 'room-demo' && o.camera_session_id !== 'cam-sess-demo-center');
      if (this.data.observations.length !== before) modified = true;
    }
    if (modified) {
      this.save();
    }
  }

  save() {
    try {
      const json = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(DB_FILE, json, 'utf8');
      try {
        fs.writeFileSync(LEGACY_DB_FILE, json, 'utf8');
      } catch (err) {}
    } catch (e) {
      console.error('Error writing DB file:', e);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(defaultData));
    this.save();
    return this.data;
  }

  // --- Users & Authentication ---
  getUsers() {
    if (!this.data.users) {
      this.data.users = [];
    }
    return this.data.users;
  }

  findUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  createUser(user) {
    if (!this.data.users) {
      this.data.users = [];
    }
    const newUser = {
      id: user.id || `usr-${Date.now()}`,
      name: (user.name || 'Campus Professional').trim(),
      email: (user.email || '').toLowerCase().trim(),
      password: user.password,
      role: (user.role || 'Facility Manager').trim(),
      department: (user.department || 'Campus Operations').trim(),
      badge: user.badge || (user.role && user.role.length <= 10 ? user.role : 'STAFF'),
      created_at: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // --- Rooms ---
  getRooms() {
    return this.data.rooms;
  }

  getRoomById(id) {
    return this.data.rooms.find(r => r.id === id);
  }

  createRoom(room) {
    sanitizeCheck(room);
    const newRoom = {
      id: room.id || `room-${Date.now()}`,
      building_name: room.building_name || 'General Campus',
      name: room.name,
      capacity: Number(room.capacity) || 30,
      demo_room: Boolean(room.demo_room),
      created_at: room.created_at || new Date().toISOString()
    };
    this.data.rooms.push(newRoom);
    this.save();
    return newRoom;
  }

  // --- Equipment ---
  getEquipment(roomId) {
    if (roomId) {
      return this.data.equipment.filter(e => e.room_id === roomId);
    }
    return this.data.equipment;
  }

  getEquipmentById(id) {
    return this.data.equipment.find(e => e.id === id);
  }

  createEquipment(eq) {
    sanitizeCheck(eq);
    const newEq = {
      id: eq.id || `eq-${Date.now()}`,
      room_id: eq.room_id,
      name: eq.name,
      quantity: Number(eq.quantity) || 1,
      rated_power_w: Number(eq.rated_power_w) || 0,
      declared_state: ['ON', 'OFF', 'UNKNOWN'].includes(eq.declared_state) ? eq.declared_state : 'UNKNOWN',
      state_declared_at: eq.state_declared_at || new Date().toISOString(),
      nonessential: Boolean(eq.nonessential),
      safety_exclusion: Boolean(eq.safety_exclusion)
    };
    this.data.equipment.push(newEq);
    this.save();
    return newEq;
  }

  updateEquipment(id, updates) {
    sanitizeCheck(updates);
    const eq = this.data.equipment.find(e => e.id === id);
    if (!eq) return null;

    if (updates.declared_state && ['ON', 'OFF', 'UNKNOWN'].includes(updates.declared_state)) {
      eq.declared_state = updates.declared_state;
      eq.state_declared_at = new Date().toISOString();
    }
    if (updates.rated_power_w !== undefined) {
      eq.rated_power_w = Number(updates.rated_power_w);
    }
    if (updates.quantity !== undefined) {
      eq.quantity = Number(updates.quantity);
    }
    if (updates.nonessential !== undefined) {
      eq.nonessential = Boolean(updates.nonessential);
    }
    if (updates.safety_exclusion !== undefined) {
      eq.safety_exclusion = Boolean(updates.safety_exclusion);
    }
    if (updates.name) {
      eq.name = updates.name;
    }

    this.save();
    return eq;
  }

  // --- Observations ---
  getObservations(roomId) {
    if (roomId) {
      return this.data.observations.filter(o => o.room_id === roomId);
    }
    return this.data.observations;
  }

  createObservation(obs) {
    // CRITICAL PRIVACY CHECK
    sanitizeCheck(obs);
    const newObs = {
      id: obs.id || `obs-${Date.now()}`,
      room_id: obs.room_id,
      camera_session_id: obs.camera_session_id || `cam-sess-${Date.now()}`,
      people_detected: Math.max(0, parseInt(obs.people_detected, 10) || 0),
      observed_at: obs.observed_at || new Date().toISOString(),
      received_at: new Date().toISOString(),
      coverage: obs.coverage !== undefined ? Number(obs.coverage) : 0.95,
      source: obs.source || 'Overhead Edge Headcount Sensor'
    };
    this.data.observations.unshift(newObs); // newest first
    if (this.data.observations.length > 200) {
      this.data.observations.pop();
    }
    this.save();
    return newObs;
  }

  // --- Emission Factors ---
  getEmissionFactors() {
    return this.data.emission_factors;
  }

  getEmissionFactorById(id) {
    return this.data.emission_factors.find(ef => ef.id === id);
  }

  createEmissionFactor(ef) {
    sanitizeCheck(ef);
    const newEf = {
      id: ef.id || `ef-${Date.now()}`,
      name: ef.name,
      value: Number(ef.value) || 0.4,
      unit: ef.unit || 'kg CO2e / kWh',
      geography: ef.geography || 'Global',
      reporting_year: Number(ef.reporting_year) || 2024,
      source_reference: ef.source_reference || 'EPA eGRID',
      gas_basis: ['CO2', 'CO2E'].includes(ef.gas_basis) ? ef.gas_basis : 'CO2E',
      factor_type: ef.factor_type || 'GRID_ELECTRICITY'
    };
    this.data.emission_factors.push(newEf);
    this.save();
    return newEf;
  }

  // --- Scenarios (Snapshot Freezing Engine) ---
  getScenarios(roomId) {
    if (roomId) {
      return this.data.scenarios.filter(s => s.room_id === roomId);
    }
    return this.data.scenarios;
  }

  getScenarioById(id) {
    return this.data.scenarios.find(s => s.id === id);
  }

  createScenario({ room_id, policy_name, hours_saved_per_day, emission_factor_id }) {
    const room = this.getRoomById(room_id);
    if (!room) throw new Error('Room not found');

    const emissionFactor = this.getEmissionFactorById(emission_factor_id) || this.data.emission_factors[0];
    const roomEquipment = this.getEquipment(room_id);

    // Controllable equipment: nonessential AND NOT safety_exclusion
    const controllableEquipment = roomEquipment.filter(eq => eq.nonessential && !eq.safety_exclusion);
    const totalControllableWatts = controllableEquipment.reduce((sum, eq) => sum + (eq.rated_power_w * eq.quantity), 0);

    const hours = Number(hours_saved_per_day) || 4;
    const dailyKwhAvoided = (totalControllableWatts * hours) / 1000;
    const annualKwhAvoided = dailyKwhAvoided * 260; // 260 operating days/year
    const annualAvoidedKgCO2e = annualKwhAvoided * emissionFactor.value;
    const annualAvoidedTonnesCO2e = annualAvoidedKgCO2e / 1000;
    const annualCostSavingsUSD = annualKwhAvoided * 0.17; // ~$0.17/kWh institutional rate

    // SNAPSHOT IMMUTABILITY GUARANTEE:
    // Store exact equipment specifications and factor values at creation moment
    const input_snapshot = {
      room_id: room.id,
      room_name: room.name,
      building_name: room.building_name,
      policy_name: policy_name || 'Automated Vacancy Power Down',
      target_hours_saved_per_day: hours,
      emission_factor_used: {
        id: emissionFactor.id,
        name: emissionFactor.name,
        value: emissionFactor.value,
        unit: emissionFactor.unit,
        gas_basis: emissionFactor.gas_basis,
        source_reference: emissionFactor.source_reference
      },
      equipment_snapshot: controllableEquipment.map(eq => ({
        id: eq.id,
        name: eq.name,
        quantity: eq.quantity,
        rated_power_w: eq.rated_power_w,
        declared_state: eq.declared_state,
        nonessential: eq.nonessential,
        safety_exclusion: eq.safety_exclusion,
        effective_controllable_power_w: eq.rated_power_w * eq.quantity
      })),
      total_controllable_power_w: totalControllableWatts
    };

    const result_snapshot = {
      daily_kwh_avoided: Math.round(dailyKwhAvoided * 100) / 100,
      annual_kwh_avoided: Math.round(annualKwhAvoided * 100) / 100,
      annual_avoided_emissions_kg_co2e: Math.round(annualAvoidedKgCO2e * 100) / 100,
      annual_avoided_emissions_t_co2e: Math.round(annualAvoidedTonnesCO2e * 100) / 100,
      estimated_annual_cost_savings_usd: Math.round(annualCostSavingsUSD * 100) / 100,
      confidence_score: 0.95,
      payback_period_months: totalControllableWatts > 2000 ? 1.5 : 3.0
    };

    const newScenario = {
      id: `scen-${Date.now()}`,
      room_id: room.id,
      created_at: new Date().toISOString(),
      input_snapshot_json: input_snapshot,
      result_snapshot_json: result_snapshot
    };

    this.data.scenarios.unshift(newScenario);
    this.save();
    return newScenario;
  }

  // --- Actions ---
  getActions(scenarioId) {
    if (scenarioId) {
      return this.data.actions.filter(a => a.scenario_id === scenarioId);
    }
    return this.data.actions;
  }

  getActionById(id) {
    return this.data.actions.find(a => a.id === id);
  }

  createAction({ scenario_id, status = 'APPROVED', completion_note = '' }) {
    const scenario = this.getScenarioById(scenario_id);
    if (!scenario) throw new Error('Scenario not found');

    const validStatus = ['APPROVED', 'COMPLETED', 'CANCELLED'].includes(status) ? status : 'APPROVED';
    const newAction = {
      id: `act-${Date.now()}`,
      scenario_id: scenario.id,
      status: validStatus,
      approved_at: new Date().toISOString(),
      completed_at: validStatus === 'COMPLETED' ? new Date().toISOString() : null,
      completion_method: 'HUMAN_CONFIRMED',
      completion_note: completion_note || 'Initiated from Carbon Twin Decarbonization Scenario Modeler.'
    };

    this.data.actions.unshift(newAction);
    this.save();
    return newAction;
  }

  updateAction(id, { status, completion_note }) {
    const action = this.getActionById(id);
    if (!action) return null;

    if (status && ['APPROVED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      action.status = status;
      if (status === 'COMPLETED' && !action.completed_at) {
        action.completed_at = new Date().toISOString();
      }
      if (status !== 'COMPLETED') {
        action.completed_at = null;
      }
    }

    if (completion_note !== undefined) {
      action.completion_note = completion_note;
    }

    // Always enforce completion_method
    action.completion_method = 'HUMAN_CONFIRMED';
    this.save();
    return action;
  }

  // --- Real-time Analytics & Aggregates ---
  getAnalyticsSummary() {
    const rooms = this.data.rooms;
    const equipment = this.data.equipment;
    const observations = this.data.observations;
    const defaultEf = this.data.emission_factors[1] || this.data.emission_factors[0]; // RFC West or first

    // Map latest observation per room
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
      const latestObs = latestObsByRoom[room.id] || { people_detected: 0, coverage: 0.95 };
      const isUnoccupied = latestObs.people_detected === 0;

      let roomActiveWatts = 0;
      let roomNonessentialActiveWatts = 0;
      let roomSafetyWatts = 0;

      for (const eq of roomEq) {
        const power = (eq.rated_power_w * eq.quantity);
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
        current_headcount: latestObs.people_detected,
        camera_coverage: latestObs.coverage,
        camera_source: latestObs.source,
        active_power_w: roomActiveWatts,
        nonessential_active_w: roomNonessentialActiveWatts,
        is_wasting_energy: isUnoccupied && roomNonessentialActiveWatts > 0,
        equipment_count: roomEq.length
      });
    }

    const currentHourlyEmissionsKgCO2e = (totalActivePowerWatts / 1000) * defaultEf.value;
    const currentHourlyWastedEmissionsKgCO2e = (wastedPowerWatts / 1000) * defaultEf.value;
    const potentialAnnualAvoidableTonnes = ((wastedPowerWatts / 1000) * 12 * 260 * defaultEf.value) / 1000;

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
      net_zero_target_pct: 42.4, // Campus baseline progress
      room_metrics: roomMetrics
    };
  }
}

const db = new Database();
module.exports = db;
