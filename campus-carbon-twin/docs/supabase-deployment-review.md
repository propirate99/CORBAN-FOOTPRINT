# Supabase PostgreSQL Database, RLS, and Security Deployment Review

**Document Location:** `campus-carbon-twin/docs/supabase-deployment-review.md`  
**Purpose:** Comprehensive review document detailing the Flyway `V3__supabase_rls_schema.sql` migration, table schemas, Row Level Security (RLS) policies, database roles, helper functions, and background retention jobs.  
**Audience:** Database Administrator (DBA), Security Reviewer, and Platform Engineers.  
**Safety Notice:** Do not execute remote SQL commands or alter the live database until this review is approved.

---

## 1. Schema Inventory & Idempotency Analysis

The application requires 10 operational and domain tables. Below is the inventory status comparing Flyway `V1__initial_schema.sql` and `V3__supabase_rls_schema.sql`:

| Table Name | Origin Status | V3 Migration Strategy | Primary Key | Foreign Keys & Relationships |
| :--- | :--- | :--- | :--- | :--- |
| **`campuses`** | **NEW** | Create if not exists | `id UUID DEFAULT gen_random_uuid()` | Standalone tenant entity |
| **`campus_memberships`**| **NEW** | Create if not exists | `id UUID DEFAULT gen_random_uuid()` | `campus_id REFERENCES campuses(id) ON DELETE CASCADE`<br>`user_id` matches `auth.users(id)` |
| **`buildings`** | **EXISTING (V1)** | Alter: add `campus_id` | `id VARCHAR(64)` | `campus_id REFERENCES campuses(id) ON DELETE SET NULL` |
| **`rooms`** | **EXISTING (V1)** | Alter: add `campus_id` | `id VARCHAR(64)` | `building_id REFERENCES buildings(id)`<br>`campus_id REFERENCES campuses(id) ON DELETE CASCADE` |
| **`equipment`** | **EXISTING (V1)** | Retain | `id VARCHAR(64)` | `room_id REFERENCES rooms(id) ON DELETE CASCADE` |
| **`camera_assignments`**| **NEW** | Create if not exists | `id UUID DEFAULT gen_random_uuid()` | `room_id REFERENCES rooms(id) ON DELETE CASCADE`<br>`user_id` matches `auth.users(id)` |
| **`observations`** | **EXISTING (V1)** | Alter: add `session_id`, `observed_at`, `server_received_at`, `source`, uniqueness | `id VARCHAR(64)` | `room_id REFERENCES rooms(id) ON DELETE CASCADE` |
| **`emission_factors`** | **NEW** | Create if not exists | `id VARCHAR(64)` | Standalone reference catalog |
| **`scenarios`** | **NEW** | Create if not exists | `id UUID DEFAULT gen_random_uuid()` | `room_id REFERENCES rooms(id) ON DELETE CASCADE`<br>`campus_id REFERENCES campuses(id)`<br>`created_by` matches `auth.users(id)` |
| **`actions`** | **EXISTING (V1)** | Alter: add `scenario_id`, `campus_id`, `approved_by`, `approved_at`, `completed_at` | `id VARCHAR(64)` | `room_id REFERENCES rooms(id)`<br>`scenario_id REFERENCES scenarios(id)`<br>`campus_id REFERENCES campuses(id)` |
| **`personal_calculations`**| **NEW** | Create if not exists | `id UUID DEFAULT gen_random_uuid()` | `user_id` matches `auth.users(id)` |

---

## 2. Core Security Model & Helper Functions

To ensure RLS evaluation is lightning fast and does not suffer from recursive query bugs, all membership checks are encapsulated in `STABLE SECURITY DEFINER` functions with fixed `search_path = public`:

```sql
-- Resolves list of campus UUIDs where the authenticated user holds an active membership
CREATE OR REPLACE FUNCTION public.get_user_campuses()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT campus_id
    FROM public.campus_memberships
    WHERE user_id = auth.uid();
$$;

-- Checks if the authenticated user is an active member of a specific campus
CREATE OR REPLACE FUNCTION public.is_campus_member(target_campus_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.campus_memberships
        WHERE campus_id = target_campus_id
          AND user_id = auth.uid()
    );
$$;

-- Checks if the authenticated user has a specific role on a specific campus
CREATE OR REPLACE FUNCTION public.has_campus_role(target_campus_id UUID, required_role VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.campus_memberships
        WHERE campus_id = target_campus_id
          AND user_id = auth.uid()
          AND role = required_role
    );
$$;
```

---

## 3. Row Level Security Policy Matrix

Every table exposed through PostgREST / Supabase Data API has RLS enabled with default-deny behavior (`REVOKE ALL FROM anon`).

| Table | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
| :--- | :--- | :--- | :--- | :--- |
| **`campuses`** | `id IN (SELECT get_user_campuses())` | **DENIED** (Server/Admin only) | **DENIED** | **DENIED** |
| **`campus_memberships`** | `user_id = auth.uid()` | **DENIED** (Self-promotion prevented) | **DENIED** | **DENIED** |
| **`rooms`** | `campus_id IN (SELECT get_user_campuses())` | **DENIED** | **DENIED** | **DENIED** |
| **`equipment`** | `room_id IN (SELECT id FROM rooms WHERE campus_id IN (SELECT get_user_campuses()))` | **DENIED** | **DENIED** | **DENIED** |
| **`camera_assignments`** | `user_id = auth.uid()` | **DENIED** | **DENIED** | **DENIED** |
| **`observations`** | `room_id IN (SELECT id FROM rooms WHERE campus_id IN (SELECT get_user_campuses()))` | **DENIED** (Must write via Spring Boot) | **DENIED** | **DENIED** |
| **`emission_factors`** | `auth.role() = 'authenticated'` | **DENIED** | **DENIED** | **DENIED** |
| **`scenarios`** | `campus_id IN (SELECT get_user_campuses())` | **DENIED** (Created via Spring Boot) | **DENIED** | **DENIED** |
| **`actions`** | `campus_id IN (SELECT get_user_campuses())` | **DENIED** (Approved via Spring Boot) | **DENIED** | **DENIED** |
| **`personal_calculations`** | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` |

---

## 4. Complete SQL Migration Content (`V3__supabase_rls_schema.sql`)

```sql
-- =========================================================================
-- V3__supabase_rls_schema.sql
-- Production-Ready Supabase Schema, Multi-Tenant Isolation, and RLS
-- =========================================================================

-- Enable pgcrypto for UUID generation if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CAMPUSES TABLE
CREATE TABLE IF NOT EXISTS public.campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CAMPUS MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.campus_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id)
    role VARCHAR(32) NOT NULL CHECK (role IN ('VIEWER', 'OPERATOR', 'MANAGER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_campus_membership_user UNIQUE(campus_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.campus_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_campus_id ON public.campus_memberships(campus_id);

-- 3. ALTER BUILDINGS (IDEMPOTENT)
ALTER TABLE public.buildings 
    ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_buildings_campus ON public.buildings(campus_id);

-- 4. ALTER ROOMS (IDEMPOTENT)
ALTER TABLE public.rooms 
    ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_rooms_campus ON public.rooms(campus_id);

-- 5. EQUIPMENT TABLE (Already exists in V1, ensure indexes)
CREATE INDEX IF NOT EXISTS idx_equipment_room_id ON public.equipment(room_id);

-- 6. CAMERA ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.camera_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users(id)
    room_id VARCHAR(64) NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_camera_assignment_user_room UNIQUE(user_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_camera_assignments_user_active ON public.camera_assignments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_camera_assignments_room ON public.camera_assignments(room_id);

-- 7. ALTER OBSERVATIONS (IDEMPOTENT)
ALTER TABLE public.observations 
    ADD COLUMN IF NOT EXISTS session_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS server_received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS source VARCHAR(64) NOT NULL DEFAULT 'edge_camera';

CREATE INDEX IF NOT EXISTS idx_observations_room_time ON public.observations(room_id, observed_at DESC);

-- Idempotent constraint for deduplication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_room_session_observed'
    ) THEN
        ALTER TABLE public.observations 
            ADD CONSTRAINT uq_room_session_observed UNIQUE(room_id, session_id, observed_at);
    END IF;
END $$;

-- 8. EMISSION FACTORS TABLE
CREATE TABLE IF NOT EXISTS public.emission_factors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value NUMERIC(10, 6) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    geography VARCHAR(64) NOT NULL,
    reporting_period VARCHAR(64) NOT NULL,
    emissions_boundary VARCHAR(128) NOT NULL,
    limitations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. SCENARIOS TABLE
CREATE TABLE IF NOT EXISTS public.scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    room_id VARCHAR(64) REFERENCES public.rooms(id) ON DELETE CASCADE,
    created_by UUID NOT NULL, -- references auth.users(id)
    scenario_name VARCHAR(255) NOT NULL,
    hvac_temp_delta_celsius NUMERIC(5, 2) NOT NULL,
    auto_shutoff_empty_rooms BOOLEAN NOT NULL DEFAULT TRUE,
    solar_capacity_kw NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    projected_monthly_co2e_saved_kg NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scenarios_campus ON public.scenarios(campus_id);

-- 10. ALTER ACTIONS TABLE (IDEMPOTENT)
ALTER TABLE public.actions 
    ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES public.scenarios(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS approved_by UUID, -- references auth.users(id)
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_actions_campus ON public.actions(campus_id);
CREATE INDEX IF NOT EXISTS idx_actions_room ON public.actions(room_id);

-- 11. PERSONAL CALCULATIONS TABLE
CREATE TABLE IF NOT EXISTS public.personal_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users(id)
    activity_type VARCHAR(32) NOT NULL CHECK (activity_type IN ('COMMUTE', 'ELECTRICITY', 'EQUIPMENT', 'TRAVEL')),
    input_parameters JSONB NOT NULL,
    calculated_kg_co2 NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_personal_calc_user ON public.personal_calculations(user_id, created_at DESC);

-- =========================================================================
-- HELPER FUNCTIONS (STABLE SECURITY DEFINER with fixed search_path)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_user_campuses()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT campus_id
    FROM public.campus_memberships
    WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_campus_member(target_campus_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.campus_memberships
        WHERE campus_id = target_campus_id
          AND user_id = auth.uid()
    );
$$;

-- =========================================================================
-- ROW LEVEL SECURITY ACTIVATION
-- =========================================================================

ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_calculations ENABLE ROW LEVEL SECURITY;

-- Revoke default broad grants
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Grant selective execution on public schema and helpers
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_campuses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_campus_member(UUID) TO authenticated;

-- Grant SELECT to authenticated on operational tables
GRANT SELECT ON public.campuses TO authenticated;
GRANT SELECT ON public.campus_memberships TO authenticated;
GRANT SELECT ON public.buildings TO authenticated;
GRANT SELECT ON public.rooms TO authenticated;
GRANT SELECT ON public.equipment TO authenticated;
GRANT SELECT ON public.camera_assignments TO authenticated;
GRANT SELECT ON public.observations TO authenticated;
GRANT SELECT ON public.emission_factors TO authenticated;
GRANT SELECT ON public.scenarios TO authenticated;
GRANT SELECT ON public.actions TO authenticated;

-- Grant CRUD to authenticated on personal calculations ONLY
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_calculations TO authenticated;

-- =========================================================================
-- RLS POLICIES (Explicit, Operation-Specific, Default-Deny)
-- =========================================================================

-- 1. campuses
DROP POLICY IF EXISTS "campuses_select_member" ON public.campuses;
CREATE POLICY "campuses_select_member" ON public.campuses
    FOR SELECT TO authenticated
    USING (id IN (SELECT public.get_user_campuses()));

-- 2. campus_memberships (Self-promotion prevented)
DROP POLICY IF EXISTS "memberships_select_self" ON public.campus_memberships;
CREATE POLICY "memberships_select_self" ON public.campus_memberships
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 3. buildings
DROP POLICY IF EXISTS "buildings_select_member" ON public.buildings;
CREATE POLICY "buildings_select_member" ON public.buildings
    FOR SELECT TO authenticated
    USING (campus_id IN (SELECT public.get_user_campuses()));

-- 4. rooms
DROP POLICY IF EXISTS "rooms_select_member" ON public.rooms;
CREATE POLICY "rooms_select_member" ON public.rooms
    FOR SELECT TO authenticated
    USING (campus_id IN (SELECT public.get_user_campuses()));

-- 5. equipment
DROP POLICY IF EXISTS "equipment_select_member" ON public.equipment;
CREATE POLICY "equipment_select_member" ON public.equipment
    FOR SELECT TO authenticated
    USING (room_id IN (SELECT r.id FROM public.rooms r WHERE r.campus_id IN (SELECT public.get_user_campuses())));

-- 6. camera_assignments
DROP POLICY IF EXISTS "camera_assignments_select_self" ON public.camera_assignments;
CREATE POLICY "camera_assignments_select_self" ON public.camera_assignments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 7. observations
DROP POLICY IF EXISTS "observations_select_member" ON public.observations;
CREATE POLICY "observations_select_member" ON public.observations
    FOR SELECT TO authenticated
    USING (room_id IN (SELECT r.id FROM public.rooms r WHERE r.campus_id IN (SELECT public.get_user_campuses())));

-- 8. emission_factors
DROP POLICY IF EXISTS "emission_factors_select_all" ON public.emission_factors;
CREATE POLICY "emission_factors_select_all" ON public.emission_factors
    FOR SELECT TO authenticated
    USING (true);

-- 9. scenarios
DROP POLICY IF EXISTS "scenarios_select_member" ON public.scenarios;
CREATE POLICY "scenarios_select_member" ON public.scenarios
    FOR SELECT TO authenticated
    USING (campus_id IN (SELECT public.get_user_campuses()));

-- 10. actions
DROP POLICY IF EXISTS "actions_select_member" ON public.actions;
CREATE POLICY "actions_select_member" ON public.actions
    FOR SELECT TO authenticated
    USING (campus_id IN (SELECT public.get_user_campuses()));

-- 11. personal_calculations (Student user-owned)
DROP POLICY IF EXISTS "personal_calc_select_owner" ON public.personal_calculations;
CREATE POLICY "personal_calc_select_owner" ON public.personal_calculations
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "personal_calc_insert_owner" ON public.personal_calculations;
CREATE POLICY "personal_calc_insert_owner" ON public.personal_calculations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "personal_calc_update_owner" ON public.personal_calculations;
CREATE POLICY "personal_calc_update_owner" ON public.personal_calculations
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "personal_calc_delete_owner" ON public.personal_calculations;
CREATE POLICY "personal_calc_delete_owner" ON public.personal_calculations
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());
```

---

## 5. Automated Data Retention Job Proposal

To preserve privacy and prevent unbounded database growth, high-frequency aggregate camera observations should be pruned after 30 days.

### Option A: PostgreSQL `pg_cron` Scheduled Job (Recommended for Supabase)
```sql
-- Schedule daily at 03:00 UTC
SELECT cron.schedule(
    'prune_old_observations',
    '0 3 * * *',
    $$
        DELETE FROM public.observations
        WHERE server_received_at < NOW() - INTERVAL '30 days';
    $$
);
```

### Option B: Database Function for Scheduled Edge Function Invocation
```sql
CREATE OR REPLACE FUNCTION public.prune_observations_older_than(days_to_keep INT DEFAULT 30)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.observations
    WHERE server_received_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;
```

---

## 6. Pre-Flight Verification Checklist Before Applying to Supabase

- [ ] All tables in `public` have RLS explicitly enabled.
- [ ] No table has wildcard policies (`USING (true)` or `WITH CHECK (true)`) on sensitive or operational data.
- [ ] `anon` role has 0 read or write access to campus rooms, equipment, observations, scenarios, actions, or memberships.
- [ ] Direct browser `INSERT`, `UPDATE`, and `DELETE` privileges are strictly revoked from `authenticated` on operational tables (`observations`, `actions`, `scenarios`, `camera_assignments`, `campus_memberships`, `campuses`, `rooms`, `equipment`).
- [ ] `personal_calculations` enforces `user_id = auth.uid()` on both `SELECT` and `INSERT`/`DELETE`.
- [ ] Deduplication index on `observations(room_id, session_id, observed_at)` prevents replay storms.
