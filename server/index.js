const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// --- Health / Status ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Carbon Twin Campus Carbon Intelligence',
    database: 'Carbon Database (data/carbon_database.json)',
    version: '2.5.0',
    compliance: {
      privacy_preserving_vision: true,
      face_embeddings_stored: false,
      student_identities_stored: false,
      continuous_location_tracking: false
    }
  });
});

// --- User Profiles ---
app.get('/api/users', (req, res) => {
  try {
    const users = db.getUsers().map(({ password, ...u }) => u);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Authentication Endpoints ---
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, institutional email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid institutional email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this institutional email already exists. Please sign in.' });
    }

    const userRole = role && role.trim() ? role.trim() : 'Sustainability Officer';
    const userDept = department && department.trim() ? department.trim() : 'Campus Facilities & Operations';
    const userBadge = userRole.length <= 12 ? userRole : 'STAFF';

    const newUser = db.createUser({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: userRole,
      department: userDept,
      badge: userBadge
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({
      success: true,
      token: `jwt-token-${Date.now()}`,
      user: safeUser,
      authMethod: 'Registration'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, sso_provider } = req.body;

  // SSO Login
  if (sso_provider) {
    const users = db.getUsers();
    const primaryUser = users[0] || {
      id: 'usr-sso',
      name: 'Campus SSO User',
      email: 'sso-user@carbontwin.edu',
      role: 'Institutional Staff',
      badge: 'SSO',
      department: 'Campus Administration'
    };
    const { password: _, ...safeUser } = primaryUser;
    return res.json({
      success: true,
      token: `sso-token-${Date.now()}`,
      user: safeUser,
      authMethod: `SSO (${sso_provider})`
    });
  }

  // Password Login
  if (!email || !password) {
    return res.status(400).json({ error: 'Institutional email and password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = db.findUserByEmail(cleanEmail);
  if (!user || user.password !== password) {
    return res.status(401).json({
      error: 'Invalid institutional email or password. Please verify your credentials or register a new account.'
    });
  }

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    token: `jwt-token-${Date.now()}`,
    user: safeUser,
    authMethod: 'Password'
  });
});

// --- Analytics KPI Summary ---
app.get('/api/analytics', (req, res) => {
  try {
    const summary = db.getAnalyticsSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Rooms ---
app.get('/api/rooms', (req, res) => {
  try {
    const rooms = db.getRooms();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:id', (req, res) => {
  try {
    const room = db.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms', (req, res) => {
  try {
    const room = db.createRoom(req.body);
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Equipment ---
app.get('/api/equipment', (req, res) => {
  try {
    const { room_id } = req.query;
    const equipment = db.getEquipment(room_id);
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/equipment', (req, res) => {
  try {
    const eq = db.createEquipment(req.body);
    res.status(201).json(eq);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/equipment/:id', (req, res) => {
  try {
    const eq = db.updateEquipment(req.params.id, req.body);
    if (!eq) return res.status(404).json({ error: 'Equipment not found' });
    res.json(eq);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Observations ---
app.get('/api/observations/latest', (req, res) => {
  try {
    const observations = db.getObservations();
    const latestMap = {};
    for (const obs of observations) {
      if (!latestMap[obs.room_id] || new Date(obs.observed_at) > new Date(latestMap[obs.room_id].observed_at)) {
        latestMap[obs.room_id] = obs;
      }
    }
    res.json(Object.values(latestMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/observations', (req, res) => {
  try {
    const { room_id } = req.query;
    const observations = db.getObservations(room_id);
    res.json(observations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/observations', (req, res) => {
  try {
    const obs = db.createObservation(req.body);
    res.status(201).json(obs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Emission Factors ---
app.get('/api/emission-factors', (req, res) => {
  try {
    const factors = db.getEmissionFactors();
    res.json(factors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emission-factors', (req, res) => {
  try {
    const factor = db.createEmissionFactor(req.body);
    res.status(201).json(factor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Scenarios (Snapshot Freezing) ---
app.get('/api/scenarios', (req, res) => {
  try {
    const { room_id } = req.query;
    const scenarios = db.getScenarios(room_id);
    res.json(scenarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scenarios', (req, res) => {
  try {
    const { room_id, policy_name, hours_saved_per_day, emission_factor_id } = req.body;
    if (!room_id) {
      return res.status(400).json({ error: 'room_id is required' });
    }
    const scenario = db.createScenario({
      room_id,
      policy_name,
      hours_saved_per_day,
      emission_factor_id
    });
    res.status(201).json(scenario);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Actions ---
app.get('/api/actions', (req, res) => {
  try {
    const { scenario_id } = req.query;
    const actions = db.getActions(scenario_id);
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/actions', (req, res) => {
  try {
    const { scenario_id, status, completion_note } = req.body;
    if (!scenario_id) {
      return res.status(400).json({ error: 'scenario_id is required' });
    }
    const action = db.createAction({ scenario_id, status, completion_note });
    res.status(201).json(action);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/actions/:id', (req, res) => {
  try {
    const action = db.updateAction(req.params.id, req.body);
    if (!action) return res.status(404).json({ error: 'Action not found' });
    res.json(action);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Telemetry Simulator ---
app.post('/api/simulate-telemetry', (req, res) => {
  try {
    const { room_id, people_detected } = req.body;
    const rooms = db.getRooms();
    const targetRoom = room_id ? rooms.find(r => r.id === room_id) : rooms[Math.floor(Math.random() * rooms.length)];

    if (!targetRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const count = people_detected !== undefined
      ? parseInt(people_detected, 10)
      : (Math.random() > 0.5 ? 0 : Math.floor(Math.random() * targetRoom.capacity * 0.7));

    const obs = db.createObservation({
      room_id: targetRoom.id,
      camera_session_id: `live-sess-${Date.now().toString(36)}`,
      people_detected: count,
      coverage: 0.96 + Math.round(Math.random() * 4) / 100,
      source: `Ceiling Edge AI Node ${targetRoom.name.slice(0, 12)}`
    });

    res.json({
      success: true,
      observation: obs,
      room: targetRoom,
      analytics: db.getAnalyticsSummary()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Reset Data to Institutional Baseline ---
app.post(['/api/reset-demo', '/api/reset-data'], (req, res) => {
  try {
    const fresh = db.reset();
    res.json({ success: true, message: 'Database reset to original institutional baseline' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Database Metadata & Tables Inspection ---
app.get('/api/database', (req, res) => {
  try {
    res.json(db.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/database/tables', (req, res) => {
  try {
    const data = db.data;
    const tables = Object.keys(data).map(name => ({
      name,
      count: Array.isArray(data[name]) ? data[name].length : 0
    }));
    res.json({
      database: 'Carbon Database (data/carbon_database.json & data/watershed_database.json)',
      table_count: tables.length,
      tables
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Carbon Twin API] Server running on http://localhost:${PORT}`);
});
