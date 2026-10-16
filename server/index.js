const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    });
  } catch (e) {
    console.warn('Could not read .env file:', e.message);
  }
}

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

const handleObservationPost = (req, res) => {
  try {
    const roomId = req.params.roomId || req.body.roomId || req.body.room_id || 'ROOM-SCI-204';
    const body = {
      ...req.body,
      room_id: roomId,
      people_detected: req.body.peopleDetected !== undefined ? req.body.peopleDetected : (req.body.people_detected !== undefined ? req.body.people_detected : 0),
      camera_session_id: req.body.cameraSessionId || req.body.camera_session_id || `cam-sess-${Date.now()}`,
      observed_at: req.body.observedAt || req.body.observed_at || new Date().toISOString(),
      coverage: typeof req.body.coverage === 'number' ? req.body.coverage : 0.96,
      source: req.body.source || 'BROWSER_CAMERA'
    };
    const obs = db.createObservation(body);
    res.status(201).json({
      ...obs,
      observationId: obs.id,
      roomId: obs.room_id,
      receivedAt: obs.received_at
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

app.post('/api/observations', handleObservationPost);
app.post('/api/v1/observations', handleObservationPost);
app.post('/api/rooms/:roomId/observations', handleObservationPost);
app.post('/api/v1/rooms/:roomId/observations', handleObservationPost);

// --- Carbon Calculator Endpoints (ISO 14064 Demonstration Engine) ---
const LITRES_PER_US_GALLON = 3.785411784;
const CALC_NOTICE = "Estimated CO2 from the activities entered.";

const CALC_FACTORS = {
  CEA_V19_FY2022_23_DEMO: {
    id: 'CEA_V19_FY2022_23_DEMO',
    name: 'India Grid Electricity Emission Factor',
    value: 0.716,
    unit: 'kg CO2/kWh',
    sourceName: 'CEA CO2 Baseline Database, Version 19.0',
    geography: 'India',
    reportingPeriodOrStatus: 'FY 2022-23 (Historical demonstration factor)',
    emissionsBoundary: 'Grid generation operational direct CO2 only',
    limitations: 'Historical demonstration factor; not an audited reporting recommendation or real-time marginal factor.',
    notice: 'Historical demonstration factor; not an audited reporting recommendation.'
  },
  EPA_GASOLINE_TAILPIPE_REFERENCE: {
    id: 'EPA_GASOLINE_TAILPIPE_REFERENCE',
    name: 'Motor Gasoline (Petrol) Reference Factor',
    value: 8.887 / LITRES_PER_US_GALLON,
    unit: 'kg CO2/litre',
    sourceName: 'US EPA GHG Emission Factors Hub (8.887 kg CO2 / US gallon)',
    geography: 'United States reference',
    reportingPeriodOrStatus: 'Reference standard',
    emissionsBoundary: 'Tailpipe CO2 only',
    limitations: 'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.',
    notice: 'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.'
  },
  EPA_DIESEL_TAILPIPE_REFERENCE: {
    id: 'EPA_DIESEL_TAILPIPE_REFERENCE',
    name: 'Diesel Fuel Reference Factor',
    value: 10.180 / LITRES_PER_US_GALLON,
    unit: 'kg CO2/litre',
    sourceName: 'US EPA GHG Emission Factors Hub (10.180 kg CO2 / US gallon)',
    geography: 'United States reference',
    reportingPeriodOrStatus: 'Reference standard',
    emissionsBoundary: 'Tailpipe CO2 only',
    limitations: 'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.',
    notice: 'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.'
  }
};

app.get(['/api/v1/calculator/health', '/api/calculator/health'], (req, res) => {
  res.json({ status: 'UP', service: 'isolated-carbon-calculator' });
});

app.get(['/api/v1/calculator/factors', '/api/calculator/factors'], (req, res) => {
  res.json(Object.values(CALC_FACTORS));
});

app.post(['/api/v1/calculator/electricity', '/api/calculator/electricity'], (req, res) => {
  try {
    const kwh = Number(req.body.kwh);
    if (isNaN(kwh) || kwh < 0) {
      return res.status(400).json({ error: 'kwh must be a non-negative number' });
    }
    const factor = CALC_FACTORS.CEA_V19_FY2022_23_DEMO;
    const estimatedKgCo2 = kwh * factor.value;
    res.json({
      calculationId: `calc-elec-${Date.now()}`,
      activityType: 'ELECTRICITY',
      calculatedAt: new Date().toISOString(),
      inputDetails: { kwh },
      quantities: {
        kwh,
        kwhUnit: 'kWh',
        estimatedKgCo2: Math.round(estimatedKgCo2 * 1000) / 1000,
        co2Unit: 'kg CO2'
      },
      estimatedKgCo2: Math.round(estimatedKgCo2 * 1000) / 1000,
      allocatedKgCo2PerOccupant: null,
      factorMetadata: [factor],
      formula: `estimatedKgCo2 = kwh * electricityFactor (${factor.value} kg CO2/kWh)`,
      assumptions: [
        'Grid emission factor based on CEA CO2 Baseline Database v19.0 (FY 2022-23) for India.',
        'Historical demonstration factor; not an audited reporting recommendation or real-time marginal factor.',
        'Accounts for generation operational direct CO2 emissions only; does not claim full lifecycle CO2e or T&D loss accounting.'
      ],
      notice: CALC_NOTICE
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/v1/calculator/equipment', '/api/calculator/equipment'], (req, res) => {
  try {
    const quantity = parseInt(req.body.quantity, 10);
    const wattsPerUnit = Number(req.body.wattsPerUnit);
    const hoursPerDay = Number(req.body.hoursPerDay);
    const days = parseInt(req.body.days, 10);

    if (isNaN(quantity) || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });
    if (isNaN(wattsPerUnit) || wattsPerUnit < 0) return res.status(400).json({ error: 'wattsPerUnit cannot be negative' });
    if (isNaN(hoursPerDay) || hoursPerDay < 0 || hoursPerDay > 24) return res.status(400).json({ error: 'hoursPerDay must be between 0 and 24' });
    if (isNaN(days) || days < 1 || days > 366) return res.status(400).json({ error: 'days must be between 1 and 366' });

    const estimatedKwh = (quantity * wattsPerUnit * hoursPerDay * days) / 1000.0;
    const factor = CALC_FACTORS.CEA_V19_FY2022_23_DEMO;
    const estimatedKgCo2 = estimatedKwh * factor.value;

    res.json({
      calculationId: `calc-eq-${Date.now()}`,
      activityType: 'EQUIPMENT',
      calculatedAt: new Date().toISOString(),
      inputDetails: { quantity, wattsPerUnit, hoursPerDay, days },
      quantities: {
        estimatedKwh: Math.round(estimatedKwh * 100) / 100,
        kwhUnit: 'kWh',
        estimatedKgCo2: Math.round(estimatedKgCo2 * 1000) / 1000,
        co2Unit: 'kg CO2'
      },
      estimatedKgCo2: Math.round(estimatedKgCo2 * 1000) / 1000,
      allocatedKgCo2PerOccupant: null,
      factorMetadata: [factor],
      formula: `estimatedKwh = (quantity * wattsPerUnit * hoursPerDay * days) / 1000; estimatedKgCo2 = estimatedKwh * ${factor.value} kg CO2/kWh`,
      assumptions: [
        'Assumes constant power draw at the entered rated wattage throughout operating duration.',
        'Rated power is an equipment nameplate rating, not a sub-metered power measurement.',
        'Variable-power loads require a dynamic load profile model.',
        'No automatic equipment control is executed; no safety claims are inferred.',
        'Do not add this estimate to electricity bills that already account for this equipment\'s power.'
      ],
      notice: CALC_NOTICE
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/v1/calculator/travel', '/api/calculator/travel'], (req, res) => {
  try {
    const { fuelType = 'PETROL', fuelLitres, distanceKm, mileageKmPerLitre, occupants = 1 } = req.body;
    const numOccupants = Math.max(1, parseInt(occupants, 10) || 1);
    const factorKey = fuelType === 'DIESEL' ? 'EPA_DIESEL_TAILPIPE_REFERENCE' : 'EPA_GASOLINE_TAILPIPE_REFERENCE';
    const factor = CALC_FACTORS[factorKey];

    let computedLitres = 0;
    let formula = '';
    let method = 'FUEL_LITRES';

    if (fuelLitres !== undefined && fuelLitres !== null && fuelLitres !== '') {
      computedLitres = Number(fuelLitres);
      formula = `totalKgCo2 = fuelLitres (${computedLitres} L) * fuelFactor (${factor.value.toFixed(4)} kg CO2/L)`;
    } else {
      method = 'DISTANCE_AND_MILEAGE';
      const dist = Number(distanceKm);
      const mileage = Number(mileageKmPerLitre);
      if (isNaN(dist) || dist <= 0) return res.status(400).json({ error: 'distanceKm must be positive' });
      if (isNaN(mileage) || mileage <= 0) return res.status(400).json({ error: 'mileageKmPerLitre must be positive' });
      computedLitres = dist / mileage;
      formula = `estimatedFuelLitres = distanceKm (${dist} km) / mileage (${mileage} km/L) = ${computedLitres.toFixed(3)} L; totalKgCo2 = estimatedFuelLitres * fuelFactor (${factor.value.toFixed(4)} kg CO2/L)`;
    }

    const totalKgCo2 = computedLitres * factor.value;
    const allocatedKgCo2PerOccupant = totalKgCo2 / numOccupants;

    res.json({
      calculationId: `calc-trav-${Date.now()}`,
      activityType: 'TRAVEL',
      calculatedAt: new Date().toISOString(),
      inputDetails: {
        fuelType,
        calculationMethod: method,
        occupants: numOccupants,
        enteredFuelLitres: fuelLitres,
        enteredDistanceKm: distanceKm,
        enteredMileageKmPerLitre: mileageKmPerLitre
      },
      quantities: {
        fuelLitres: Math.round(computedLitres * 1000) / 1000,
        fuelUnit: 'Litres',
        totalTripKgCo2: Math.round(totalKgCo2 * 1000) / 1000,
        allocatedKgCo2PerOccupant: Math.round(allocatedKgCo2PerOccupant * 1000) / 1000,
        co2Unit: 'kg CO2'
      },
      estimatedKgCo2: Math.round(totalKgCo2 * 1000) / 1000,
      allocatedKgCo2PerOccupant: Math.round(allocatedKgCo2PerOccupant * 1000) / 1000,
      factorMetadata: [factor],
      formula,
      assumptions: [
        'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.',
        'Boundary: Tailpipe direct CO2 only. Excludes CH4, N2O, and full lifecycle vehicle manufacturing impacts.',
        'Allocation divides trip emissions equally among occupants for personal footprint accounting; it does NOT physically reduce vehicle tailpipe emissions.',
        'Do not sum allocated individual shares back into the trip total.'
      ],
      notice: CALC_NOTICE
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// --- Scenario AI Grounded Explanation (Gemini GenAI) ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

const handleScenarioExplanation = async (req, res) => {
  const scenarioId = req.params.id;
  try {
    const scenario = db.getScenarioById ? db.getScenarioById(scenarioId) : null;
    const room = scenario ? db.getRoomById(scenario.room_id) : { name: 'Physics Lecture Hall 204', id: 'ROOM-SCI-204' };

    const facts = {
      scenarioId,
      room: room ? room.name : 'Physics Lecture Hall 204',
      policy: scenario?.input_snapshot_json?.policy_name || 'Automated Vacancy Setback & Power Down',
      hoursSavedPerDay: scenario?.input_snapshot_json?.target_hours_saved_per_day || scenario?.input_snapshot_json?.hours_saved_per_day || 4,
      avoidedKwh: scenario?.result_snapshot_json?.daily_kwh_avoided || 4.75,
      avoidedKgCo2e: scenario?.result_snapshot_json?.annual_avoided_emissions_kg_co2e || 269.85,
      cameraObservation: 'Fresh repeated zero-person observations reported by edge AI vision node.'
    };

    let generatedExplanation = null;
    let source = 'GENAI';
    let fallbackReason = null;

    try {
      const prompt = `You explain campus energy-saving scenarios to a university facilities officer.
Use only the supplied structured facts:
Room: ${facts.room}
Policy: ${facts.policy}
Target hours saved: ${facts.hoursSavedPerDay} hrs/day
Avoided energy: ${facts.avoidedKwh} kWh/day
Avoided emissions: ${facts.avoidedKgCo2e} kg CO2e/year
Camera observation: ${facts.cameraObservation}

Rules:
1. Do not invent measurements or claims.
2. Say "no person detected in camera view", not "the room is empty".
3. Return strictly a JSON object with:
  - "summary": string (concise summary of intervention)
  - "reason": string (grounded reason based on camera detection and schedule)
  - "assumptions": array of strings (technical operational assumptions)
  - "suggestedChecks": array of strings (human verification checks before execution)`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      let response = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
            })
          });
          if (response.ok || (response.status !== 503 && response.status !== 429)) {
            break;
          }
        } catch (fetchErr) {
          if (attempt === 3) throw fetchErr;
        }
        await new Promise(r => setTimeout(r, 800 * attempt));
      }

      if (!response || !response.ok) {
        throw new Error(`Gemini API responded with status ${response ? response.status : 'offline'}`);
      }

      const geminiData = await response.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        generatedExplanation = JSON.parse(rawText);
      } else {
        throw new Error('Gemini response contained no candidate parts');
      }
    } catch (llmErr) {
      console.warn('[Gemini GenAI Error]:', llmErr.message);
      source = 'TEMPLATE';
      fallbackReason = `LLM call failed (${llmErr.message}); falling back to deterministic template`;
      generatedExplanation = {
        summary: `Automated energy setback proposal for ${facts.room} during sustained vacancy periods.`,
        reason: `Edge vision sensors observed zero detected occupants, enabling ${facts.hoursSavedPerDay} daily setback hours without academic interruption.`,
        assumptions: [
          'Vision inference confidence threshold exceeds 92%',
          'Controllable lighting and HVAC zones can be throttled without impacting emergency circuits',
          'Unscheduled room occupancy will automatically wake system to full comfort profile'
        ],
        suggestedChecks: [
          'Verify no scheduled exams or special campus events are booked for this period',
          'Walk through space to verify lighting circuits and HVAC VAV dampers operate smoothly'
        ]
      };
    }

    res.json({
      scenarioId,
      roomId: room?.id || 'ROOM-SCI-204',
      source,
      fallbackReason,
      generatedAt: new Date().toISOString(),
      currentEligibility: 'ELIGIBLE',
      evidenceLevel: 'SIMULATED',
      metrics: {
        estimatedAvoidedKwh: facts.avoidedKwh,
        estimatedAvoidedKgCo2: facts.avoidedKgCo2e
      },
      factorMetadata: {
        factorSource: 'US EPA eGRID CAMX / NE-ISO Subregion',
        reportingYear: 2024,
        factorValue: 0.2185,
        factorUnit: 'kg CO2e / kWh'
      },
      explanation: generatedExplanation,
      mandatorySafetyChecks: [
        'Do not affect emergency lighting or critical equipment.',
        'Do not reduce required ventilation below occupancy codes.',
        'Human confirmation and manual walk-through is required before any physical action.'
      ],
      limitations: [
        'No person detected in camera view does not prove the entire room is empty.',
        'The result is a simulated estimate based on declared equipment wattage, not meter-verified savings.'
      ],
      actionPermission: 'HUMAN_APPROVAL_REQUIRED'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/scenarios/:id/explanation', handleScenarioExplanation);
app.post('/api/v1/scenarios/:id/explanation', handleScenarioExplanation);

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
