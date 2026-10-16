-- =============================================================================
-- Migration 001: Core campus schema
-- Tables: campuses, campus_memberships, rooms, personal_calculations
-- RLS: enabled on all tables; default-deny for browser clients
-- Run in: Supabase SQL editor (development project first)
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. CAMPUSES
--    One row per physical campus.  Created by administrators only.
-- ---------------------------------------------------------------------------
create table public.campuses (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. CAMPUS MEMBERSHIPS
--    Links auth.users to campuses.  Role column controls what each user
--    may do on that campus.
--    Allowed roles:
--      VIEWER   - read-only dashboard access
--      OPERATOR - may publish aggregate observations (via backend)
--      MANAGER  - may approve/complete actions (via backend)
--
--    SECURITY: no INSERT policy is created here.  Only administrator-
--    controlled processes (service-role key or admin API) may create rows.
-- ---------------------------------------------------------------------------
create table public.campus_memberships (
  campus_id  uuid  not null references public.campuses(id)   on delete cascade,
  user_id    uuid  not null references auth.users(id)         on delete cascade,
  role       text  not null check (role in ('VIEWER', 'OPERATOR', 'MANAGER')),

  primary key (campus_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 3. ROOMS
-- ---------------------------------------------------------------------------
create table public.rooms (
  id             uuid        primary key default gen_random_uuid(),
  campus_id      uuid        not null references public.campuses(id) on delete cascade,
  building_name  text        not null,
  name           text        not null,
  capacity       integer     check (capacity is null or capacity >= 0),
  is_demo        boolean     not null default false,
  created_at     timestamptz not null default now(),

  unique (campus_id, building_name, name)
);

-- ---------------------------------------------------------------------------
-- 4. PERSONAL CALCULATIONS
-- ---------------------------------------------------------------------------
create table public.personal_calculations (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  activity_type    text        not null
                     check (activity_type in ('ELECTRICITY', 'EQUIPMENT', 'TRAVEL')),
  input_snapshot   jsonb       not null,
  factor_snapshot  jsonb       not null,
  result_snapshot  jsonb       not null,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
create index campus_memberships_user_idx
  on public.campus_memberships(user_id);

create index rooms_campus_idx
  on public.rooms(campus_id);

create index personal_calculations_user_created_idx
  on public.personal_calculations(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.campuses             enable row level security;
alter table public.campus_memberships   enable row level security;
alter table public.rooms                enable row level security;
alter table public.personal_calculations enable row level security;

-- ---------------------------------------------------------------------------
-- REVOKE DEFAULT BROWSER PRIVILEGES (default-deny)
-- ---------------------------------------------------------------------------
revoke all on public.campuses              from anon, authenticated;
revoke all on public.campus_memberships    from anon, authenticated;
revoke all on public.rooms                 from anon, authenticated;
revoke all on public.personal_calculations from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RE-GRANT ONLY REQUIRED OPERATIONS
-- ---------------------------------------------------------------------------
grant select on public.campuses           to authenticated;
grant select on public.campus_memberships to authenticated;
grant select on public.rooms              to authenticated;
grant select, insert, delete
  on public.personal_calculations
  to authenticated;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- None use USING(true) or WITH CHECK(true).
-- ---------------------------------------------------------------------------

create policy "memberships_read_own"
  on public.campus_memberships
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "campuses_read_member"
  on public.campuses
  for select to authenticated
  using (
    exists (
      select 1 from public.campus_memberships m
      where  m.campus_id = campuses.id
        and  m.user_id   = (select auth.uid())
    )
  );

create policy "rooms_read_member"
  on public.rooms
  for select to authenticated
  using (
    exists (
      select 1 from public.campus_memberships m
      where  m.campus_id = rooms.campus_id
        and  m.user_id   = (select auth.uid())
    )
  );

create policy "calculations_read_own"
  on public.personal_calculations
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "calculations_insert_own"
  on public.personal_calculations
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "calculations_delete_own"
  on public.personal_calculations
  for delete to authenticated
  using (user_id = (select auth.uid()));

commit;
