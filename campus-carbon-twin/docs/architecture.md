# Campus Carbon Twin - Architecture & System Design

## 1. Executive Overview

The Campus Carbon Twin (CCT) bridges physical campus spaces and real-time operational mitigation by combining lightweight, privacy-preserving edge computer vision with a deterministic thermodynamic and carbon emissions digital twin, backed by Supabase Auth and multi-tenant PostgreSQL Row Level Security (RLS).

```
+---------------------------------------------------------------------------------------+
|                                    EDGE & CLIENT TIER                                 |
|   +-----------------------+           +----------------------+                        |
|   | Classroom Edge Camera |           | Student Personal     |                        |
|   | (MediaPipe / WASM)    |           | Footprint Calculator |                        |
|   +-----------+-----------+           +----------+-----------+                        |
|               |                                  |                                    |
|               | Zero-PII Observation             | Direct RLS Read & Delete           |
|               | Bearer JWT Authenticated         | auth.uid() = user_id               |
|               v                                  v                                    |
|   +-----------------------+           +----------------------+                        |
|   | Spring Boot API       |           | Supabase PostgREST   |                        |
|   | Ingestion Gateway     |           | Direct Data API      |                        |
|   +-----------+-----------+           +----------+-----------+                        |
+---------------|----------------------------------|------------------------------------+
                |                                  |
                v                                  v
+---------------------------------------------------------------------------------------+
|                                   DATA & SECURITY TIER                                |
|   PostgreSQL 16 (Supabase)                                                            |
|   - Multi-tenant RLS Isolation (campuses, campus_memberships)                         |
|   - Operational Tables (rooms, equipment, emission_factors, scenarios, actions)       |
|   - Security Definer Helpers: get_user_campuses(), is_campus_member()                 |
|   - Automated 30-Day Rollup & Purge via pg_cron                                       |
+---------------------------------------------------------------------------------------+
```

---

## 2. Multi-Tenant Security & Access Control Architecture

The platform implements a strict defense-in-depth security architecture separating direct read telemetries from state-mutating operational actions.

### 2.1 Two-Tier Access Model

| Access Channel | Target Operations | Security Enforcement Mechanism |
|---|---|---|
| **Direct Browser → Supabase Data API** | Direct read of `rooms`, `equipment`, and `emission_factors`; Student CRUD on `personal_calculations`. | **PostgreSQL Row Level Security (RLS)**<br>- `get_user_campuses()` filters data to signed-in user's assigned campuses.<br>- `personal_calculations` strictly constrained to `auth.uid() = user_id`.<br>- Browser writes to operational tables (`observations`, `actions`, `scenarios`) are **REVOKED**. |
| **Browser / Edge → Spring Boot Gateway** | Observation ingestion, action approval/execution, and scenario simulations. | **OAuth2 Resource Server JWT Verification + Database-Backed RBAC**<br>- Validates JWT signature via Supabase JWKS.<br>- Enforces issuer, expiration, and audience (`authenticated`).<br>- Verifies active DB roles (`VIEWER`, `OPERATOR`, `MANAGER`) and room assignments. |

### 2.2 Role-Based Access Control (RBAC) Matrix

- **STUDENT / GUEST:**
  - Can calculate personal footprints and read/delete only their own saved calculations (`user_id = auth.uid()`).
  - Cannot access administrative actions or submit camera telemetry.
- **VIEWER:**
  - Can read rooms, equipment, and aggregated emission factors for campuses where they hold membership.
  - Cannot publish camera observations or approve mitigation actions.
- **OPERATOR:**
  - Authorized to ingest observations for specific rooms where they hold an active row in `camera_assignments`.
  - Must supply a valid active `sessionId` and verified Bearer JWT.
- **MANAGER:**
  - Authorized to transition mitigation actions from `PENDING_APPROVAL` to `APPROVED` or `EXECUTED` for their assigned campus.
  - Approval audits permanently record verified approver UUID and timestamp.

---

## 3. Core Subsystems

### 3.1 In-Browser Edge Vision AI
- Runs entirely on-device using MediaPipe / TensorFlow Lite WASM.
- Inspects room vacancy at 1-2 FPS without transmitting video or image data over the network.
- Publishes strictly numerical payloads:
  - `roomId`: string
  - `personCount`: integer
  - `confidenceScore`: float [0.0 - 1.0]
  - `sessionId`: string (session tracking)
  - `observedAt`: ISO-8601 timestamp

### 3.2 Ingestion Gateway & State Protection
- **Duplicate Observation Rejection:** Queries composite key `(room_id, session_id, observed_at)` and returns HTTP `409 Conflict` on duplicates.
- **Stale Observation Protection:** Checks incoming observation timestamp against latest recorded observation. Older observations are archived but prevented from overwriting newer room occupancy states.

### 3.3 Energy & Carbon Calculation Engine
The energy consumption of room $r$ at time $t$ is calculated by:
$$P_r(t) = \sum_{e \in \text{Equipment}_r} \left( \mathbb{I}_{\text{active}}(e) \cdot W_{\text{active}}(e) + (1 - \mathbb{I}_{\text{active}}(e)) \cdot W_{\text{standby}}(e) \right)$$

Emissions rate:
$$\text{EmissionRate}_r(t) = P_r(t) \times \text{EmissionFactor}_{\text{grid}} \quad [\text{kg CO}_2\text{e / hour}]$$

### 3.4 Waste Eligibility & Action Rules
- **Ghost Classroom Rule:** If `personCount == 0` while high-draw equipment (> 1.5 kW) is running, mark room state as `WASTEFUL`.
- **Mitigation Proposal:** Automatically generate an `ActionEntity` in `PENDING_APPROVAL` status proposing HVAC setback or automated shutoff.
