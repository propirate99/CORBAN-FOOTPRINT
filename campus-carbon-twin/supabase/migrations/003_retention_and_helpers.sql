-- =============================================================================
-- Migration 003: Retention job + helper functions
-- Depends on: 002_operational_tables.sql
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- HELPER: is_campus_member(campus_id, role)
-- Returns true if the calling user has the given role (or higher) on campus.
-- Used by the backend via RPC; also useful in future RLS policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_campus_member(
  p_campus_id uuid,
  p_role      text default 'VIEWER'
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from   public.campus_memberships m
    where  m.campus_id = p_campus_id
      and  m.user_id   = auth.uid()
      and  m.role      = any(
             case p_role
               when 'VIEWER'   then array['VIEWER',   'OPERATOR', 'MANAGER']
               when 'OPERATOR' then array['OPERATOR', 'MANAGER']
               when 'MANAGER'  then array['MANAGER']
               else array[]::text[]
             end
           )
  );
$$;

-- ---------------------------------------------------------------------------
-- HELPER: latest_observation(room_id)
-- Returns the most recently RECEIVED observation for a room.
-- Used by the backend to reject stale / duplicate observations.
-- ---------------------------------------------------------------------------
create or replace function public.latest_observation(p_room_id uuid)
returns table (
  id                uuid,
  people_detected   integer,
  observed_at       timestamptz,
  received_at       timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, people_detected, observed_at, received_at
  from   public.observations
  where  room_id = p_room_id
  order  by received_at desc
  limit  1;
$$;

-- ---------------------------------------------------------------------------
-- RETENTION JOB: purge_old_observations()
-- Deletes aggregate observations older than 24 hours.
-- Schedule this function using pg_cron or Supabase scheduled functions.
--
-- To enable pg_cron in Supabase:
--   Database > Extensions > pg_cron
-- Then run once (outside this migration, after enabling the extension):
--   select cron.schedule(
--     'purge_observations_24h',
--     '0 * * * *',            -- every hour
--     $$ select public.purge_old_observations(); $$
--   );
-- ---------------------------------------------------------------------------
create or replace function public.purge_old_observations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.observations
  where  received_at < now() - interval '24 hours';

  get diagnostics deleted_count = row_count;

  -- Log how many rows were removed for audit purposes.
  raise notice 'purge_old_observations: deleted % rows at %',
               deleted_count, now();

  return deleted_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- COLUMN-LEVEL RESTRICTION: hide camera_session_id from browser reads
-- The authenticated role already has no SELECT grant on camera_assignments.
-- For observations, revoke camera_session_id specifically so the join-based
-- dashboard query cannot expose session identifiers.
-- ---------------------------------------------------------------------------
revoke select (camera_session_id) on public.observations from authenticated;

-- ---------------------------------------------------------------------------
-- PREVENT GRANT ESCALATION
-- Ensure no one can grant themselves more privileges on these functions.
-- ---------------------------------------------------------------------------
revoke all on function public.is_campus_member(uuid, text)   from public, anon;
revoke all on function public.latest_observation(uuid)       from public, anon;
revoke all on function public.purge_old_observations()       from public, anon;

-- Backend (service-role) can execute all helpers.
-- Authenticated browser users may call is_campus_member for self-checks only
-- (security definer means it always runs as the definer with auth.uid()).
grant execute on function public.is_campus_member(uuid, text) to authenticated;

commit;

-- =============================================================================
-- RETENTION SETUP REMINDER (run once after enabling pg_cron extension):
--
--   select cron.schedule(
--     'purge_observations_24h',
--     '0 * * * *',
--     $$ select public.purge_old_observations(); $$
--   );
--
-- Verify the job exists:
--   select * from cron.job where jobname = 'purge_observations_24h';
-- =============================================================================
