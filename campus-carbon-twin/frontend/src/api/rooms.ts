import { request } from './client';
import { Room, CampusSummary } from '../types/api';

export async function getCampusSummary(): Promise<CampusSummary> {
  return request<CampusSummary>('/campus');
}

export async function getRooms(buildingId?: string): Promise<Room[]> {
  const query = buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : '';
  return request<Room[]>(`/rooms${query}`);
}

export async function getRoomDetail(roomId: string): Promise<Room> {
  return request<Room>(`/rooms/${encodeURIComponent(roomId)}`);
}
