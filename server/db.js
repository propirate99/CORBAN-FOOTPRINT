const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'carbon_database.json');
const LEGACY_DB_FILE = path.join(__dirname, '..', 'data', 'watershed_database.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial seed data adhering strictly to the user-specified schema
const defaultData = {
  rooms: [
    {
      id: 'room-101',
      building_name: 'Curie Science Complex',
      name: 'Advanced Robotics & Automation Lab',
      capacity: 35,
      demo_room: false,
      created_at: '2024-01-10T08:00:00Z'
    },
    {
      id: 'room-102',
      building_name: 'Curie Science Complex',
      name: 'Bio-Analytical Chemistry Suite',
      capacity: 24,
      demo_room: false,
      created_at: '2024-01-12T09:30:00Z'
    },
    {
      id: 'room-201',
      building_name: 'Turing Computing Institute',
      name: 'High-Performance GPU Cluster Lab',
      capacity: 40,
      demo_room: false,
      created_at: '2024-02-01T10:15:00Z'
    },
    {
      id: 'room-202',
      building_name: 'Turing Computing Institute',
      name: 'Collaborative Seminar Auditorium A',
      capacity: 120,
      demo_room: false,
      created_at: '2024-02-05T11:00:00Z'
    },
    {
      id: 'room-301',
      building_name: 'Franklin Engineering Wing',
      name: 'Digital Fabrication & 3D Prototyping Hall',
      capacity: 30,
      demo_room: false,
      created_at: '2024-03-01T08:45:00Z'
    }
  ],
  equipment: [
    // Room 101 - Robotics Lab
    {
      id: 'eq-101-1',
      room_id: 'room-101',
      name: 'Overhead High-Lumen LED Bay Matrix',
      quantity: 12,
      rated_power_w: 120,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T08:00:00Z',
      nonessential: true,
      safety_exclusion: false
    },
    {
      id: 'eq-101-2',
      room_id: 'room-101',
      name: 'Industrial Robotic Arm Controller Rigs',
      quantity: 4,
      rated_power_w: 750,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T09:00:00Z',
      nonessential: true,
      safety_exclusion: false
    },
    {
      id: 'eq-101-3',
      room_id: 'room-101',
      name: 'Emergency Exhaust & Negative Pressure Hood',
      quantity: 2,
      rated_power_w: 1100,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T07:30:00Z',
      nonessential: false,
      safety_exclusion: true // Critical safety: must never auto-power down
    },

    // Room 102 - Bio-Analytical Suite
    {
      id: 'eq-102-1',
      room_id: 'room-102',
      name: 'Spectrophotometer & Centrifuge Bench',
      quantity: 3,
      rated_power_w: 450,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T08:30:00Z',
      nonessential: true,
      safety_exclusion: false
    },
    {
      id: 'eq-102-2',
      room_id: 'room-102',
      name: 'Ultra-Low Temperature Cryo-Freezer (-80C)',
      quantity: 2,
      rated_power_w: 1250,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T06:00:00Z',
      nonessential: false,
      safety_exclusion: true // Biological sample integrity
    },
    {
      id: 'eq-102-3',
      room_id: 'room-102',
      name: 'Benchtop Workstation Displays',
      quantity: 8,
      rated_power_w: 85,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T08:45:00Z',
      nonessential: true,
      safety_exclusion: false
    },

    // Room 201 - Turing GPU Lab
    {
      id: 'eq-201-1',
      room_id: 'room-201',
      name: 'AI Engineering Workstations (Dual 4K + Rig)',
      quantity: 20,
      rated_power_w: 380,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T08:15:00Z',
      nonessential: true,
      safety_exclusion: false
    },
    {
      id: 'eq-201-2',
      room_id: 'room-201',
      name: 'Server Rack Supplemental Precision CRAC A/C',
      quantity: 1,
      rated_power_w: 3200,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T07:00:00Z',
      nonessential: false,
      safety_exclusion: true
    },

    // Room 202 - Seminar Auditorium
    {
      id: 'eq-202-1',
      room_id: 'room-202',
      name: 'Laser Projection System & Stage Par-Cans',
      quantity: 2,
      rated_power_w: 1400,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T10:00:00Z',
      nonessential: true,
      safety_exclusion: false
    },
    {
      id: 'eq-202-2',
      room_id: 'room-202',
      name: 'Auditorium Variable Air Volume HVAC Damper',
      quantity: 1,
      rated_power_w: 2400,
      declared_state: 'ON',
      state_declared_at: '2024-10-15T09:30:00Z',
      nonessential: true,
      safety_exclusion: false
    },

    // Room 301 - Fabrication Hall
    {
      id: 'eq-301-1',
      room_id: 'room-301',
      name: 'High-Speed FDM 3D Printers Array',
      quantity: 6,
      rated_power_w: 350,
      declared_state: 'OFF',
      state_declared_at: '2024-10-15T06:00:00Z',
      nonessential: true,
      safety_exclusion: false
    },
    {
      id: 'eq-301-2',
      room_id: 'room-301',
      name: 'HEPA Particulate Dust Scrubber',
      quantity: 2,
      rated_power_w: 600,
      declared_state: 'OFF',
      state_declared_at: '2024-10-15T06:00:00Z',
      nonessential: false,
      safety_exclusion: true
    }
  ],
  observations: [
    // Zero face embeddings, zero student IDs, zero continuous location tracking
    {
      id: 'obs-001',
      room_id: 'room-101',
      camera_session_id: 'cam-sess-curie-101-alpha',
      people_detected: 0, // Unoccupied! Yet 4,440W of equipment is declared ON!
      observed_at: '2024-10-15T12:15:00Z',
      received_at: '2024-10-15T12:15:02Z',
      coverage: 0.98,
      source: 'Ceiling Edge Optical Sensor 101-North'
    },
    {
      id: 'obs-002',
      room_id: 'room-102',
      camera_session_id: 'cam-sess-curie-102-beta',
      people_detected: 6,
      observed_at: '2024-10-15T12:18:00Z',
      received_at: '2024-10-15T12:18:01Z',
      coverage: 0.92,
      source: 'Ceiling Edge Optical Sensor 102-Central'
    },
    {
      id: 'obs-003',
      room_id: 'room-201',
      camera_session_id: 'cam-sess-turing-201-gpu',
      people_detected: 18,
      observed_at: '2024-10-15T12:20:00Z',
      received_at: '2024-10-15T12:20:03Z',
      coverage: 0.99,
      source: 'Turing Hallway Edge Unit 201'
    },
    {
      id: 'obs-004',
      room_id: 'room-202',
      camera_session_id: 'cam-sess-turing-202-aud',
      people_detected: 0, // Auditorium empty, projector & stage lights ON!
      observed_at: '2024-10-15T12:22:00Z',
      received_at: '2024-10-15T12:22:01Z',
      coverage: 0.95,
      source: 'Auditorium Panoramic Edge Node'
    },
    {
      id: 'obs-005',
      room_id: 'room-301',
      camera_session_id: 'cam-sess-franklin-301',
      people_detected: 0,
      observed_at: '2024-10-15T12:10:00Z',
      received_at: '2024-10-15T12:10:02Z',
      coverage: 0.94,
      source: 'Franklin Hall Overhead Mesh'
    }
  ],
  emission_factors: [
    {
      id: 'ef-egrid-camx',
      name: 'US EPA eGRID CAMX Grid Subregion',
      value: 0.2185,
      unit: 'kg CO2e / kWh',
      geography: 'US-CA (California)',
      reporting_year: 2024,
      source_reference: 'EPA eGRID 2024v1 Table 1',
      gas_basis: 'CO2E',
      factor_type: 'GRID_ELECTRICITY'
    },
    {
      id: 'ef-egrid-rfcw',
      name: 'US EPA eGRID RFC West (PJM Interconnection)',
      value: 0.4412,
      unit: 'kg CO2e / kWh',
      geography: 'US-Midwest (PJM)',
      reporting_year: 2024,
      source_reference: 'EPA eGRID 2024v1 Table 2',
      gas_basis: 'CO2E',
      factor_type: 'GRID_ELECTRICITY'
    },
    {
      id: 'ef-egrid-nycw',
      name: 'US EPA eGRID NYC / Westchester Subregion',
      value: 0.2840,
      unit: 'kg CO2e / kWh',
      geography: 'US-NY (New York City)',
      reporting_year: 2024,
      source_reference: 'EPA eGRID 2024v1 Table 1',
      gas_basis: 'CO2E',
      factor_type: 'GRID_ELECTRICITY'
    },
    {
      id: 'ef-defra-uk',
      name: 'UK DEFRA National Grid Electricity Average',
      value: 0.2071,
      unit: 'kg CO2e / kWh',
      geography: 'United Kingdom',
      reporting_year: 2024,
      source_reference: 'UK Department for Energy Security & Net Zero GHG Factors',
      gas_basis: 'CO2E',
      factor_type: 'GRID_ELECTRICITY'
    },
    {
      id: 'ef-iea-eu',
      name: 'IEA European Union 27 Average Electricity Mix',
      value: 0.2310,
      unit: 'kg CO2e / kWh',
      geography: 'European Union',
      reporting_year: 2023,
      source_reference: 'IEA World Energy Outlook GHG Statistics',
      gas_basis: 'CO2',
      factor_type: 'GRID_ELECTRICITY'
    }
  ],
  scenarios: [
    {
      id: 'scen-001',
      room_id: 'room-101',
      created_at: '2024-10-10T14:30:00Z',
      // CRITICAL REQUIREMENT: Store the equipment and factor values used in the snapshot.
      // Otherwise, editing an equipment rating tomorrow could silently change the meaning of yesterday’s scenario.
      input_snapshot_json: {
        room_id: 'room-101',
        room_name: 'Advanced Robotics & Automation Lab',
        building_name: 'Curie Science Complex',
        policy_name: 'Automate Idle Robotics Lab Standby & High-Bay Lighting',
        target_hours_saved_per_day: 5.5,
        emission_factor_used: {
          id: 'ef-egrid-rfcw',
          name: 'US EPA eGRID RFC West (PJM Interconnection)',
          value: 0.4412,
          unit: 'kg CO2e / kWh',
          gas_basis: 'CO2E'
        },
        equipment_snapshot: [
          {
            id: 'eq-101-1',
            name: 'Overhead High-Lumen LED Bay Matrix',
            quantity: 12,
            rated_power_w: 120,
            nonessential: true,
            safety_exclusion: false,
            effective_controllable_power_w: 1440
          },
          {
            id: 'eq-101-2',
            name: 'Industrial Robotic Arm Controller Rigs',
            quantity: 4,
            rated_power_w: 750,
            nonessential: true,
            safety_exclusion: false,
            effective_controllable_power_w: 3000
          }
          // Note: eq-101-3 excluded because safety_exclusion = true
        ],
        total_controllable_power_w: 4440
      },
      result_snapshot_json: {
        daily_kwh_avoided: 24.42,
        annual_kwh_avoided: 6349.2,
        annual_avoided_emissions_kg_co2e: 2801.27,
        annual_avoided_emissions_t_co2e: 2.80,
        estimated_annual_cost_savings_usd: 1079.36,
        confidence_score: 0.94,
        payback_period_months: 1.8
      }
    },
    {
      id: 'scen-002',
      room_id: 'room-202',
      created_at: '2024-10-12T16:00:00Z',
      input_snapshot_json: {
        room_id: 'room-202',
        room_name: 'Collaborative Seminar Auditorium A',
        building_name: 'Turing Computing Institute',
        policy_name: 'Occupancy-Triggered AV & HVAC Setback Interlock',
        target_hours_saved_per_day: 6.0,
        emission_factor_used: {
          id: 'ef-egrid-rfcw',
          name: 'US EPA eGRID RFC West (PJM Interconnection)',
          value: 0.4412,
          unit: 'kg CO2e / kWh',
          gas_basis: 'CO2E'
        },
        equipment_snapshot: [
          {
            id: 'eq-202-1',
            name: 'Laser Projection System & Stage Par-Cans',
            quantity: 2,
            rated_power_w: 1400,
            nonessential: true,
            safety_exclusion: false,
            effective_controllable_power_w: 2800
          },
          {
            id: 'eq-202-2',
            name: 'Auditorium Variable Air Volume HVAC Damper',
            quantity: 1,
            rated_power_w: 2400,
            nonessential: true,
            safety_exclusion: false,
            effective_controllable_power_w: 2400
          }
        ],
        total_controllable_power_w: 5200
      },
      result_snapshot_json: {
        daily_kwh_avoided: 31.2,
        annual_kwh_avoided: 8112.0,
        annual_avoided_emissions_kg_co2e: 3578.96,
        annual_avoided_emissions_t_co2e: 3.58,
        estimated_annual_cost_savings_usd: 1379.04,
        confidence_score: 0.96,
        payback_period_months: 1.2
      }
    }
  ],
  actions: [
    {
      id: 'act-001',
      scenario_id: 'scen-001',
      status: 'COMPLETED',
      approved_at: '2024-10-11T09:00:00Z',
      completed_at: '2024-10-14T15:30:00Z',
      completion_method: 'HUMAN_CONFIRMED',
      completion_note: 'Facility Engineer J. Martinez verified hardware relay interlock installed on robotics bench power circuits. Idle standby confirmed at 0W when room sensor reads vacant for >15 mins.'
    },
    {
      id: 'act-002',
      scenario_id: 'scen-002',
      status: 'APPROVED',
      approved_at: '2024-10-13T11:20:00Z',
      completed_at: null,
      completion_method: 'HUMAN_CONFIRMED',
      completion_note: 'Approved by Campus Energy Manager. Work order #WO-9921 scheduled with electrical team for Crestron AV automation setback.'
    }
  ],
  users: [
    {
      id: 'usr-admin',
      name: 'Dr. Elena Vance',
      email: 'director@carbontwin.edu',
      password: 'admin123',
      role: 'Chief Sustainability Officer',
      badge: 'CSO',
      department: 'Campus Climate & Sustainability Office',
      created_at: '2024-01-01T00:00:00Z'
    }
  ]
};

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
      } else if (fs.existsSync(LEGACY_DB_FILE)) {
        const raw = fs.readFileSync(LEGACY_DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        this.save();
        try { fs.unlinkSync(LEGACY_DB_FILE); } catch (err) {}
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
      this.data.observations = this.data.observations.filter(o => o.room_id !== 'room-demo' && o.id !== 'obs-006');
      if (this.data.observations.length !== before) modified = true;
    }
    if (modified) {
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
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
