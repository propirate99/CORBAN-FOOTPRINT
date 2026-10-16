import { request } from './client';
import { Room, CampusSummary } from '../types/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface RoomFetchResult {
  rooms: Room[];
  isLive: boolean;
  isStale: boolean;
  error?: string;
  lastUpdated: string;
}

export async function getCampusSummary(): Promise<CampusSummary> {
  return request<CampusSummary>('/campus');
}

/**
 * Reads rooms directly via Supabase PostgREST with PostgreSQL RLS enforcement.
 * Enforces Rule 3: Must NOT silently fall back to backend or demo fixtures on error.
 */
export async function getRooms(buildingId?: string): Promise<Room[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase
      .from('rooms')
      .select('*, equipment(*)');

    if (buildingId) {
      query = query.eq('building_id', buildingId);
    }

    const { data, error } = await query;

    if (error) {
      // Surface explicit error; NEVER fall back silently
      throw new Error(`Supabase RLS Data Read Error: ${error.message} (Code ${error.code})`);
    }

    if (!data) {
      return [];
    }

    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      buildingId: r.building_id,
      capacity: r.capacity ?? 30,
      currentOccupancy: r.current_occupancy ?? 0,
      status: r.status ?? 'OPTIMAL',
      powerDrawKw: Number(r.power_draw_kw ?? 0.0),
      emissionRateKgCo2ePerHour: Number(r.emission_rate_kg_co2e_per_hour ?? 0.0),
      equipment: (r.equipment || []).map((eq: any) => ({
        id: eq.id,
        name: eq.name,
        roomId: eq.room_id,
        type: eq.type,
        isActive: eq.is_active,
        wattageWatts: Number(eq.active_wattage || 0),
      })),
      lastReceivedAt: r.created_at,
      observationState: r.current_occupancy > 0 ? 'OCCUPIED' : 'NO_PERSON_DETECTED',
    }));
  }

  // When Supabase is not configured in local environment, read from backend API
  const query = buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : '';
  return request<Room[]>(`/rooms${query}`);
}

export async function getRoomDetail(roomId: string): Promise<Room> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, equipment(*)')
      .eq('id', roomId)
      .single();

    if (error) {
      throw new Error(`Supabase RLS Room Detail Read Error: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      buildingId: data.building_id,
      capacity: data.capacity ?? 30,
      currentOccupancy: data.current_occupancy ?? 0,
      status: data.status ?? 'OPTIMAL',
      powerDrawKw: Number(data.power_draw_kw ?? 0.0),
      emissionRateKgCo2ePerHour: Number(data.emission_rate_kg_co2e_per_hour ?? 0.0),
      equipment: (data.equipment || []).map((eq: any) => ({
        id: eq.id,
        name: eq.name,
        roomId: eq.room_id,
        type: eq.type,
        isActive: eq.is_active,
        wattageWatts: Number(eq.active_wattage || 0),
      })),
      lastReceivedAt: data.created_at,
    };
  }

  return request<Room>(`/rooms/${encodeURIComponent(roomId)}`);
}
