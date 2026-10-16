import React, { useState } from 'react';
import { useSupabaseSession } from './useSupabaseSession';

export const AuthHeaderWidget: React.FC = () => {
  const { user, isConfigured, signInWithPassword, signOut, loading, error } = useSupabaseSession();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please provide both email and password.');
      return;
    }
    setSubmitting(true);
    setAuthError(null);
    try {
      await signInWithPassword(email, password);
      setShowModal(false);
      setPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!isConfigured) {
    return (
      <div style={{ fontSize: '0.75rem', background: '#334155', color: '#cbd5e1', padding: '4px 10px', borderRadius: '6px' }}>
        Supabase: <span style={{ color: '#f59e0b', fontWeight: 600 }}>Unconfigured (Demo Mode)</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            User: <strong style={{ color: '#38bdf8' }}>{user.email}</strong>
          </span>
          <button
            onClick={handleSignOut}
            disabled={loading}
            style={{
              background: '#334155',
              border: '1px solid #475569',
              color: '#f8fafc',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#0284c7',
            border: 'none',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Sign In
        </button>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '8px',
              width: '340px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              border: '1px solid #334155',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Supabase Sign In</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              Sign in with your campus account credentials. Direct RLS data isolation will be applied based on your user ID and campus memberships.
            </p>

            {(authError || error) && (
              <div
                style={{
                  background: '#7f1d1d',
                  color: '#fecaca',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                {authError || error}
              </div>
            )}

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: '#cbd5e1' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@campus.edu"
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    boxSizing: 'border-box',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: '#cbd5e1' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    boxSizing: 'border-box',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: '#334155',
                    border: 'none',
                    color: '#94a3b8',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: '#0284c7',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {submitting ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
