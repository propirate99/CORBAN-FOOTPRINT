import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Attach Supabase access token if session exists
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {
      // Session fetch failed; continue with unauthenticated request
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let serverError = `API error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.message) serverError = errJson.message;
      } catch {
        // Fallback to status text
      }
      throw new Error(serverError);
    }

    return await response.json();
  } catch (error: any) {
    // Sanitized logging: never log authorization headers or tokens
    console.warn(`Request failed for endpoint ${endpoint}: ${error?.message || 'Unknown network error'}`);
    throw error;
  }
}
