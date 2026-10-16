-- =========================================================================
-- V3__supabase_rls_schema.sql
-- Production-Ready Supabase Schema, Multi-Tenant Isolation, and RLS
-- =========================================================================

-- Enable pgcrypto for UUID generation if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CAMPUSES TABLE
CREATE TABLE IF NOT EXISTS campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CAMPUS MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS campus_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('VIEWER', 'OPERATOR', 'MANAGER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_campus_membership_user UNIQUE(campus_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON campus_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_campus_id ON campus_memberships(campus_id);

-- 3. ALTER BUILDINGS (IDEMPOTENT)
ALTER TABLE buildings 
    ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_buildings_campus ON buildings(campus_id);

-- 4. ALTER ROOMS (IDEMPOTENT)
ALTER TABLE rooms 
    ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_rooms_campus ON rooms(campus_id);

-- 5. EQUIPMENT TABLE (Ensure index on room_id)
CREATE INDEX IF NOT EXISTS idx_equipment_room_id ON equipment(room_id);

-- 6. CAMERA ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS camera_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_camera_assignment_user_room UNIQUE(user_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_camera_assignments_user_active ON camera_assignments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_camera_assignments_room ON camera_assignments(room_id);

-- 7. ALTER OBSERVATIONS (IDEMPOTENT)
ALTER TABLE observations 
    ADD COLUMN IF NOT EXISTS session_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS server_received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS source VARCHAR(64) NOT NULL DEFAULT 'edge_camera';

CREATE INDEX IF NOT EXISTS idx_observations_room_time ON observations(room_id, observed_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_room_session_observed'
    ) THEN
        ALTER TABLE observations 
            ADD CONSTRAINT uq_room_session_observed UNIQUE(room_id, session_id, observed_at);
    END IF;
END $$;

-- 8. EMISSION FACTORS TABLE
CREATE TABLE IF NOT EXISTS emission_factors (
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
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    scenario_name VARCHAR(255) NOT NULL,
    hvac_temp_delta_celsius NUMERIC(5, 2) NOT NULL,
    auto_shutoff_empty_rooms BOOLEAN NOT NULL DEFAULT TRUE,
    solar_capacity_kw NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    projected_monthly_co2e_saved_kg NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scenarios_campus ON scenarios(campus_id);

-- 10. ALTER ACTIONS TABLE (IDEMPOTENT)
ALTER TABLE actions 
    ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS approved_by UUID,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_actions_campus ON actions(campus_id);
CREATE INDEX IF NOT EXISTS idx_actions_room ON actions(room_id);

-- 11. PERSONAL CALCULATIONS TABLE
CREATE TABLE IF NOT EXISTS personal_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type VARCHAR(32) NOT NULL CHECK (activity_type IN ('COMMUTE', 'ELECTRICITY', 'EQUIPMENT', 'TRAVEL')),
    input_parameters JSONB NOT NULL,
    calculated_kg_co2 NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_personal_calc_user ON personal_calculations(user_id, created_at DESC);

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

ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_calculations ENABLE ROW LEVEL SECURITY;

-- Revoke default broad grants
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Grant selective execution on public schema and helpers
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_campuses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_campus_member(UUID) TO authenticated;

-- Grant SELECT to authenticated on operational tables
GRANT SELECT ON campuses TO authenticated;
GRANT SELECT ON campus_memberships TO authenticated;
GRANT SELECT ON buildings TO authenticated;
GRANT SELECT ON rooms TO authenticated;
GRANT SELECT ON equipment TO authenticated;
GRANT SELECT ON camera_assignments TO authenticated;
GRANT SELECT ON observations TO authenticated;
GRANT SELECT ON emission_factors TO authenticated;
GRANT SELECT ON scenarios TO authenticated;
GRANT SELECT ON actions TO authenticated;

-- Grant CRUD to authenticated on personal calculations ONLY
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_calculations TO authenticated;

-- =========================================================================
-- RLS POLICIES (Explicit, Operation-Specific, Default-Deny)
-- =========================================================================

-- 1. campuses
DROP POLICY IF EXISTS "campuses_select_member" ON campuses;
CREATE POLICY "campuses_select_member" ON campuses
    FOR SELECT TO authenticated
    USING (id IN (SELECT public.get_user_campuses()));

-- 2. campus_memberships (Self-promotion prevented)
DROP POLICY IF EXISTS "memberships_select_self" ON campus_memberships;
CREATE POLICY "memberships_select_self" ON campus_memberships
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 3. buildings
DROP POLICY IF EXISTS "buildings_select_member" ON buildings;
CREATE POLICY "buildings_select_member" ON buildings
    FOR SELECT TO authenticated
    USING (campus_id IN (SELECT public.get_user_campuses()));

-- 4. rooms
DROP POLICY IF EXISTS "rooms_select_member" ON rooms;
CREATE POLICY "rooms_select_member" ON rooms
    FOR SELECT TO authenticated
    USING (campus_id IN (SELECT public.get_user_campuses()));

-- 5. equipment
DROP POLICY IF EXISTS "equipment_select_member" ON equipment;
CREATE POLICY "equipment_select_member" ON equipment
    FOR SELECT TO authenticated
    USING (room_id IN (SELECT r.id FROM rooms r WHERE r.campus_id IN (SELECT public.get_user_campuses())));

-- 6. camera_assignments
DROP POLICY IF EXISTS "camera_assignments_select_self" ON camera_assignments;
CREATE POLICY "camera_assignments_select_self" ON camera_assignments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 7. observations
DROP POLICY IF EXISTS "observations_select_member" ON observations;
CREATE POLICY "observations_select_member" ON observations
    FOR SELECT TO authenticated
    USING (room_id IN (SELECT r.id FROM rooms r WHERE r.campus_id IN (SELECT public.get_user_campuses())));

-- 8. emission_factors
DROP POLICY IF EXISTS "emission_factors_select_all" ON emission_factors;
CREATE POLICY "emission_factors_select_all" ON emission_factors
    FOR SELECT TO authenticated
    USING (true);

-- 9. scenarios
DROP POLICY IF EXISTS "scenarios_select_member" ON scenarios;
CREATE POLICY "scenarios_select_member" ON scenarios
    FOR SELECT TO authenticated
    USING (campus_id IN (SELECT public.get_user_campuses()));

-- 10. actions
DROP POLICY IF EXISTS "actions_select_member" ON actions;
CREATE POLICY "actions_select_member" ON actions
    FOR SELECT TO authenticated
    USING (campus_id IN (SELECT public.get_user_campuses()));

-- 11. personal_calculations (Student user-owned)
DROP POLICY IF EXISTS "personal_calc_select_owner" ON personal_calculations;
CREATE POLICY "personal_calc_select_owner" ON personal_calculations
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "personal_calc_insert_owner" ON personal_calculations;
CREATE POLICY "personal_calc_insert_owner" ON personal_calculations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "personal_calc_update_owner" ON personal_calculations;
CREATE POLICY "personal_calc_update_owner" ON personal_calculations
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "personal_calc_delete_owner" ON personal_calculations;
CREATE POLICY "personal_calc_delete_owner" ON personal_calculations
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());
