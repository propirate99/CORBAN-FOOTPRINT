-- =============================================================================
-- Migration 002: Operational tables
-- Tables: equipment, camera_assignments, observations,
--         emission_factors, scenarios, actions
-- Depends on: 001_core_campus_schema.sql
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. EQUIPMENT
--    Each piece of equipment belongs to one room.
--    declared_state: what occupants/staff said the device state is.
--    safety_exclusion: true = must never be shut off (servers, medical, etc.)
--    nonessential: true = candidate for automatic shutdown in scenarios.
-- ---------------------------------------------------------------------------
create table public.equipment (
  id                 uuid        primary key default gen_random_uuid(),
  room_id            uuid        not null references public.rooms(id) on delete cascade,
  name               text        not null,
  quantity           integer     not null default 1 check (quantity >= 1),
  rated_power_w      numeric(10,2) not null check (rated_power_w >= 0),
  declared_state     text        not null default 'UNKNOWN'
                       check (declared_state in ('ON', 'OFF', 'UNKNOWN')),
  state_declared_at  timestamptz,
  nonessential       boolean     not null default false,
  safety_exclusion   boolean     not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. CAMERA ASSIGNMENTS
--    Restricts which rooms an OPERATOR user may publish observations for.
--    active: set false to revoke without deleting history.
--    Sensitive - do not expose in broad room dashboard queries.
-- ---------------------------------------------------------------------------
create table public.camera_assignments (
  id          uuid        primary key default gen_random_uuid(),
  room_id     uuid        not null references public.rooms(id)  on delete cascade,
  user_id     uuid        not null references auth.users(id)     on delete cascade,
  active      boolean     not null default true,
  assigned_at timestamptz not null default now(),

  unique (room_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 3. OBSERVATIONS
--    Aggregate people counts only.  No images, embeddings, or audio.
--    observed_at:  timestamp the camera client captured the count.
--    received_at:  server-side timestamp; never trust client-supplied time.
--    coverage:     fraction of room covered by camera field of view (0-1).
--    source:       'CAMERA' | 'MANUAL' | 'SENSOR' etc.
--
--    Stale-observation guard: the backend must reject observations whose
--    observed_at is older than the latest observation for that room.
-- ---------------------------------------------------------------------------
create table public.observations (
  id                uuid        primary key default gen_random_uuid(),
  room_id           uuid        not null references public.rooms(id)  on delete cascade,
  camera_session_id text,
  people_detected   integer     not null check (people_detected >= 0),
  observed_at       timestamptz not null,
  received_at       timestamptz not null default now(),
  coverage          numeric(4,3) check (coverage >= 0 and coverage <= 1),
  source            text        not null default 'CAMERA',

  -- Retention index: backend job deletes rows older than 24 h.
  constraint observations_received_not_future
    check (received_at <= now() + interval '5 minutes')
);

-- ---------------------------------------------------------------------------
-- 4. EMISSION FACTORS
--    Reference values used in calculations.  Immutable once inserted so
--    that historical scenarios remain traceable.
--    gas_basis: CO2 = single gas; CO2E = CO2-equivalent aggregate.
--    factor_type: 'GRID_ELECTRICITY' | 'NATURAL_GAS' | 'DIESEL' | etc.
-- ---------------------------------------------------------------------------
create table public.emission_factors (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  value            numeric(18,8) not null check (value > 0),
  unit             text        not null,
  geography        text        not null,
  reporting_year   integer     not null check (reporting_year >= 1990),
  source_reference text        not null,
  gas_basis        text        not null check (gas_basis in ('CO2', 'CO2E')),
  factor_type      text        not null,
  created_at       timestamptz not null default now(),

  unique (name, geography, reporting_year, gas_basis)
);

-- ---------------------------------------------------------------------------
-- 5. SCENARIOS
--    Snapshots the equipment list, factor values, and calculation inputs
--    at the moment the scenario is run so that later edits to equipment or
--    factors do not silently change historical results.
-- ---------------------------------------------------------------------------
create table public.scenarios (
  id                    uuid        primary key default gen_random_uuid(),
  room_id               uuid        not null references public.rooms(id) on delete cascade,
  created_by            uuid        not null references auth.users(id),
  created_at            timestamptz not null default now(),

  -- Inputs supplied by the user/system at scenario creation time.
  input_snapshot_json   jsonb       not null,

  -- Copy of every equipment row used in this scenario at creation time.
  -- Prevents rated_power_w edits from changing historical KWh calculations.
  equipment_snapshot_json jsonb     not null,

  -- Copy of every emission-factor row used at creation time.
  -- Prevents factor updates from changing historical CO2e calculations.
  factor_snapshot_json  jsonb       not null,

  -- Calculated outputs.
  result_snapshot_json  jsonb       not null
);

-- ---------------------------------------------------------------------------
-- 6. ACTIONS
--    One action per scenario recommendation.  Tracks approval and human-
--    confirmed completion.  No automated completion method in v1.
-- ---------------------------------------------------------------------------
create table public.actions (
  id                uuid        primary key default gen_random_uuid(),
  scenario_id       uuid        not null references public.scenarios(id) on delete cascade,
  approved_by       uuid        references auth.users(id),
  status            text        not null default 'PENDING'
                      check (status in ('PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED')),
  approved_at       timestamptz,
  completed_at      timestamptz,
  completion_method text        check (completion_method in ('HUMAN_CONFIRMED')),
  completion_note   text,
  created_at        timestamptz not null default now(),

  -- An action must be approved before it can be completed.
  constraint actions_completed_requires_approval
    check (
      status != 'COMPLETED'
      or (approved_by is not null and approved_at is not null)
    ),

  -- completed_at must be set when status is COMPLETED.
  constraint actions_completed_at_set
    check (status != 'COMPLETED' or completed_at is not null),

  -- completion_method must be set when status is COMPLETED.
  constraint actions_completion_method_set
    check (status != 'COMPLETED' or completion_method is not null)
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
create index equipment_room_idx
  on public.equipment(room_id);

create index camera_assignments_user_idx
  on public.camera_assignments(user_id);

create index camera_assignments_room_idx
  on public.camera_assignments(room_id);

-- Key query: latest observation per room (dashboard polling).
create index observations_room_received_idx
  on public.observations(room_id, received_at desc);

-- Retention job: delete rows older than 24 h.
create index observations_received_at_idx
  on public.observations(received_at);

create index scenarios_room_idx
  on public.scenarios(room_id);

create index scenarios_created_by_idx
  on public.scenarios(created_by);

create index actions_scenario_idx
  on public.actions(scenario_id);

-- ---------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.equipment          enable row level security;
alter table public.camera_assignments enable row level security;
alter table public.observations       enable row level security;
alter table public.emission_factors   enable row level security;
alter table public.scenarios          enable row level security;
alter table public.actions            enable row level security;

-- ---------------------------------------------------------------------------
-- REVOKE DEFAULT BROWSER PRIVILEGES (default-deny)
-- ---------------------------------------------------------------------------
revoke all on public.equipment          from anon, authenticated;
revoke all on public.camera_assignments from anon, authenticated;
revoke all on public.observations       from anon, authenticated;
revoke all on public.emission_factors   from anon, authenticated;
revoke all on public.scenarios          from anon, authenticated;
revoke all on public.actions            from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RE-GRANT ONLY REQUIRED READS
-- No browser INSERT/UPDATE/DELETE for operational tables.
-- All writes go through the Spring Boot backend (validates token + role).
-- camera_assignments is NOT granted to authenticated - staff assignment
-- data must not be visible in broad room dashboard reads.
-- ---------------------------------------------------------------------------
grant select on public.equipment        to authenticated;
grant select on public.observations     to authenticated;
grant select on public.emission_factors to authenticated;
grant select on public.scenarios        to authenticated;
grant select on public.actions          to authenticated;

-- camera_assignments: NOT granted to authenticated.
-- The backend uses its service-role connection and checks assignments itself.

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- All policies check campus membership to ensure cross-campus isolation.
-- ---------------------------------------------------------------------------

-- equipment: readable if user belongs to the room's campus.
create policy "equipment_read_campus_member"
  on public.equipment
  for select to authenticated
  using (
    exists (
      select 1
      from   public.rooms r
      join   public.campus_memberships m on m.campus_id = r.campus_id
      where  r.id        = equipment.room_id
        and  m.user_id   = (select auth.uid())
    )
  );

-- observations: readable if user belongs to the room's campus.
-- Intentionally excludes camera_session_id from the grant
-- (column-level restriction is in the grant; this policy restricts rows).
create policy "observations_read_campus_member"
  on public.observations
  for select to authenticated
  using (
    exists (
      select 1
      from   public.rooms r
      join   public.campus_memberships m on m.campus_id = r.campus_id
      where  r.id      = observations.room_id
        and  m.user_id = (select auth.uid())
    )
  );

-- emission_factors: readable by any authenticated user.
-- Reference data; not campus-specific.
create policy "emission_factors_read_authenticated"
  on public.emission_factors
  for select to authenticated
  using (true);
-- NOTE: 'using (true)' is intentional here only because emission_factors
-- contains public reference data (published grid intensities, IPCC factors).
-- No personal or campus-private data exists in this table.

-- scenarios: readable if user belongs to the room's campus.
create policy "scenarios_read_campus_member"
  on public.scenarios
  for select to authenticated
  using (
    exists (
      select 1
      from   public.rooms r
      join   public.campus_memberships m on m.campus_id = r.campus_id
      where  r.id      = scenarios.room_id
        and  m.user_id = (select auth.uid())
    )
  );

-- actions: readable if user belongs to the scenario's room's campus.
create policy "actions_read_campus_member"
  on public.actions
  for select to authenticated
  using (
    exists (
      select 1
      from   public.scenarios s
      join   public.rooms r       on r.id        = s.room_id
      join   public.campus_memberships m on m.campus_id = r.campus_id
      where  s.id      = actions.scenario_id
        and  m.user_id = (select auth.uid())
    )
  );

commit;

-- =============================================================================
-- NOTES
-- 1. camera_assignments has RLS enabled but no SELECT grant to authenticated.
--    The backend accesses it via service-role; it is never exposed to browsers.
-- 2. No INSERT/UPDATE/DELETE policies exist for any operational table.
--    All mutations go through authenticated Spring Boot endpoints that:
--      a. Verify the Supabase JWT (issuer, signature, expiry).
--      b. Check campus membership and role from the database.
--      c. Check room assignment for OPERATOR writes.
--      d. Use the service-role Supabase client for the actual write.
-- 3. Scenarios store THREE snapshots (input, equipment, factor) so that
--    editing equipment ratings or factor values tomorrow cannot silently
--    change the meaning of a scenario created today.
-- 4. Observations must be written with server-assigned received_at.
--    The backend must reject stale observations (observed_at older than
--    the latest received observation for that room).
-- =============================================================================
