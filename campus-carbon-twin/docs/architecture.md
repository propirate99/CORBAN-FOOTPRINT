# Campus Carbon Twin - Architecture & System Design

## 1. Executive Overview

The Campus Carbon Twin (CCT) bridges physical campus spaces and real-time operational mitigation by combining lightweight, privacy-preserving edge computer vision with a deterministic thermodynamic and carbon emissions digital twin.

```
+-------------------------------------------------------------------------+
|                              EDGE TIER                                  |
|   +-----------------------+           +------------------------------+  |
|   |   Classroom Camera    |           |   WebRTC / HTML5 Video       |  |
|   +-----------+-----------+           +--------------+---------------+  |
|               |                                      |                  |
|               +------------------+-------------------+                  |
|                                  |                                      |
|                                  v                                      |
|                 +----------------------------------+                    |
|                 | Browser WASM / TFLite Detector   |                    |
|                 | (Zero-PII: Outputs person count) |                    |
|                 +----------------+-----------------+                    |
+----------------------------------|--------------------------------------+
                                   | HTTP POST /api/v1/observations
                                   v
+-------------------------------------------------------------------------+
|                             BACKEND TIER                                |
|   +-----------------------------------------------------------------+   |
|   | Ingestion Gateway (Deduplication, Noise Filtering)              |   |
|   +------------------------------+----------------------------------+   |
|                                  |                                      |
|   +------------------------------v----------------------------------+   |
|   | Digital Twin Simulation Core                                    |   |
|   |  - EnergyCalculator: P(kW) = sum(equip_active) vs standby        |   |
|   |  - EligibilityRules: Vacancy detection & Waste threshold checks |   |
|   |  - Grid Carbon Factor: kg CO2e / kWh regional dynamic intensity  |   |
|   +------------------------------+----------------------------------+   |
|                                  |                                      |
|   +------------------------------v----------------------------------+   |
|   | Explanation & Action Dispatcher                                 |   |
|   |  - Gemini LLM Client / Deterministic Fallback                   |   |
|   |  - Automated or Operator-Approved Mitigation Workflow           |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
                                   |
                                   v
+-------------------------------------------------------------------------+
|                             DATA TIER                                   |
|   PostgreSQL 16: Buildings, Rooms, Equipment, Observations, Actions     |
+-------------------------------------------------------------------------+
```

## 2. Core Subsystems

### 2.1 In-Browser Edge Vision AI
- Runs locally inside the browser using TensorFlow Lite / WASM.
- Analyzes video frames at 1-2 FPS.
- Only publishes JSON observations containing:
  - `roomId`: string
  - `personCount`: integer
  - `confidenceScore`: float [0.0 - 1.0]
  - `timestamp`: ISO-8601 string
- **Zero Video Data** leaves the local browser device.

### 2.2 Energy & Carbon Calculation Engine
The energy consumption of room $r$ at time $t$ is calculated by:
$$P_r(t) = \sum_{e \in 	ext{Equipment}_r} \left( \mathbb{I}_{	ext{active}}(e) \cdot W_{	ext{active}}(e) + (1 - \mathbb{I}_{	ext{active}}(e)) \cdot W_{	ext{standby}}(e) ight)$$

Emissions rate:
$$	ext{EmissionRate}_r(t) = P_r(t) 	imes 	ext{EmissionFactor}_{	ext{grid}} \quad [	ext{kg CO}_2	ext{e / hour}]$$

### 2.3 Waste Eligibility & Action Rules
- **Rule 1 (Ghost Classroom)**: If `personCount == 0` for $> 10$ minutes while `HVAC == ON` or `Lights == ON`, mark state as `WASTEFUL_OCCUPANCY`.
- **Rule 2 (Mitigation Proposal)**: Auto-generate an `ActionItem` to reset HVAC setpoint to eco-mode (saving ~1.8 kW) or schedule remote shutoff.
