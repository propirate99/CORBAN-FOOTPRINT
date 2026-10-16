/**
 * supabase.ts
 *
 * Single shared Supabase client for browser use.
 * Uses the PUBLISHABLE key only — never the service-role key.
 * Access control is enforced by Row Level Security policies and
 * the user'"'"'s signed-in session token.
 *
 * IMPORTANT: Do NOT import this file in any server-side or backend code.
 * The Spring Boot backend must use its own service-role client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL is not set. ' +
    'Copy .env.example to .env.local and fill in your Supabase project URL.'
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY is not set. ' +
    'This must be the anon/publishable key — never the service-role key.'
  );
}

// Validate that a service-role key was not accidentally pasted.
// Service-role keys start with "eyJ" and contain ".service_role" after decoding.
// This is a best-effort guard; the real protection is keeping secret keys out
// of environment files that are bundled with the frontend.
if (supabasePublishableKey.includes('service_role')) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY appears to be a service-role key. ' +
    'Service-role keys bypass RLS and must NEVER be placed in frontend code.'
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      // Persist session in localStorage so the user stays signed in
      // across page reloads.
      persistSession: true,
      // Auto-refresh the access token before it expires.
      autoRefreshToken: true,
    },
  }
);

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Sign in with email and password.
 * Do NOT log the returned session, access token, or password.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  // Return only the user object; callers must not log the session.
  return data.user;
}

/** Sign out and clear the local session. */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Returns the current session, or null if signed out. */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Returns the access token string for attaching to Spring Boot API requests.
 * The token must be sent as:   Authorization: Bearer <token>
 * The backend must verify the token before trusting any claim inside it.
 */
export async function getBearerToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

// ---------------------------------------------------------------------------
// Campus + room reads (RLS restricts to the user'"'"'s own campuses)
// ---------------------------------------------------------------------------

/** Load all campuses the signed-in user belongs to. */
export async function loadMyCampuses() {
  const { data, error } = await supabase
    .from('campuses')
    .select('id, name, created_at')
    .order('name');
  if (error) throw error;
  return data;
}

/** Load rooms on a specific campus. RLS enforces membership. */
export async function loadRooms(campusId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, campus_id, building_name, name, capacity, is_demo, created_at')
    .eq('campus_id', campusId)
    .order('building_name')
    .order('name');
  if (error) throw error;
  return data;
}

/** Load equipment for a room. RLS enforces campus membership. */
export async function loadEquipment(roomId: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select(
      'id, room_id, name, quantity, rated_power_w, ' +
      'declared_state, state_declared_at, nonessential, safety_exclusion, created_at'
    )
    .eq('room_id', roomId)
    .order('name');
  if (error) throw error;
  return data;
}

/**
 * Load the latest observation for a room.
 * camera_session_id is excluded from the SELECT (column-level restriction).
 */
export async function loadLatestObservation(roomId: string) {
  const { data, error } = await supabase
    .from('observations')
    .select(
      'id, room_id, people_detected, observed_at, received_at, coverage, source'
      // camera_session_id intentionally omitted
    )
    .eq('room_id', roomId)
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Load recent observations for a room (last N hours for dashboard sparkline). */
export async function loadRecentObservations(roomId: string, hours = 1) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from('observations')
    .select('id, room_id, people_detected, observed_at, received_at, coverage, source')
    .eq('room_id', roomId)
    .gte('received_at', since)
    .order('received_at', { ascending: true });
  if (error) throw error;
  return data;
}

/** Load all emission factors (public reference data). */
export async function loadEmissionFactors() {
  const { data, error } = await supabase
    .from('emission_factors')
    .select('id, name, value, unit, geography, reporting_year, gas_basis, factor_type')
    .order('reporting_year', { ascending: false })
    .order('name');
  if (error) throw error;
  return data;
}

/** Load scenarios for a room. RLS enforces campus membership. */
export async function loadScenarios(roomId: string) {
  const { data, error } = await supabase
    .from('scenarios')
    .select(
      'id, room_id, created_by, created_at, ' +
      'input_snapshot_json, result_snapshot_json'
      // equipment_snapshot_json and factor_snapshot_json intentionally
      // omitted from list view to reduce payload size.
    )
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Load a single scenario with full snapshots (for detail view). */
export async function loadScenarioDetail(scenarioId: string) {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();
  if (error) throw error;
  return data;
}

/** Load actions for a scenario. */
export async function loadActions(scenarioId: string) {
  const { data, error } = await supabase
    .from('actions')
    .select(
      'id, scenario_id, status, approved_at, completed_at, ' +
      'completion_method, completion_note, created_at'
      // approved_by (user uuid) intentionally omitted from broad reads.
    )
    .eq('scenario_id', scenarioId)
    .order('created_at');
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Personal calculations (user-owned rows; RLS enforces ownership)
// ---------------------------------------------------------------------------

/** Load the signed-in user'"'"'s saved calculation history. */
export async function loadMyCalculations() {
  const { data, error } = await supabase
    .from('personal_calculations')
    .select('id, activity_type, input_snapshot, factor_snapshot, result_snapshot, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Save a personal calculation result.
 * user_id is set by the RLS WITH CHECK policy — the value below must match
 * the signed-in user or the insert will be rejected.
 */
export async function saveCalculation(payload: {
  user_id: string;
  activity_type: 'ELECTRICITY' | 'EQUIPMENT' | 'TRAVEL';
  input_snapshot: Record<string, unknown>;
  factor_snapshot: Record<string, unknown>;
  result_snapshot: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('personal_calculations')
    .insert(payload)
    .select('id, created_at')
    .single();
  if (error) throw error;
  return data;
}

/** Delete one of the user'"'"'s saved calculations. */
export async function deleteCalculation(id: string) {
  const { error } = await supabase
    .from('personal_calculations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
