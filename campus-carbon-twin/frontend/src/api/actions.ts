import { request } from './client';
import { ActionItem } from '../types/api';

export async function getActions(): Promise<ActionItem[]> {
  return request<ActionItem[]>('/actions');
}

export async function updateActionStatus(actionId: string, status: string): Promise<ActionItem> {
  return request<ActionItem>('/actions', {
    method: 'POST',
    body: JSON.stringify({ actionId, status }),
  });
}
