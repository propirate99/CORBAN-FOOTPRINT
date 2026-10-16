import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SupabaseAuthState {
  user: User | null;
  session: Session | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useSupabaseSession(): SupabaseAuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (!isMounted) return;
      if (sessionError) {
        setError(sessionError.message);
      } else {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setAccessToken(initialSession?.access_token ?? null);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setAccessToken(currentSession?.access_token ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase is not configured.');
    }
    setError(null);
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
    setSession(data.session);
    setUser(data.user);
    setAccessToken(data.session?.access_token ?? null);
  };

  const signOut = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setAccessToken(null);
    setLoading(false);
  };

  return {
    user,
    session,
    accessToken,
    loading,
    error,
    isConfigured: isSupabaseConfigured(),
    signInWithPassword,
    signOut,
  };
}
