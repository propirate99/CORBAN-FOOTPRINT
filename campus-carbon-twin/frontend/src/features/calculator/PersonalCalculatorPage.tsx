import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSupabaseSession } from '../../auth/useSupabaseSession';

interface SavedCalculation {
  id: string;
  activity_type: string;
  input_parameters: Record<string, any>;
  calculated_kg_co2: number;
  created_at: string;
}

export const PersonalCalculatorPage: React.FC = () => {
  const [commuteMiles, setCommuteMiles] = useState<number>(8);
  const [commuteMode, setCommuteMode] = useState<string>('car');
  const [labHours, setLabHours] = useState<number>(4);

  const { user, isConfigured } = useSupabaseSession();
  const [savedHistory, setSavedHistory] = useState<SavedCalculation[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const modeFactors: Record<string, number> = {
    car: 0.385, // kg CO2e / mile
    ev: 0.110,
    transit: 0.075,
    bike: 0.0,
  };

  const commuteDailyCo2e = commuteMiles * (modeFactors[commuteMode] || 0);
  const labDailyCo2e = labHours * 0.15 * 0.428; // ~150W workstation
  const totalDailyCo2e = commuteDailyCo2e + labDailyCo2e;

  // Load user's saved calculations with RLS (user_id = auth.uid())
  const loadHistory = useCallback(async () => {
    if (!isConfigured || !supabase || !user) {
      setSavedHistory([]);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const { data, error } = await supabase
        .from('personal_calculations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setSavedHistory(data || []);
    } catch (err: any) {
      setHistoryError(err?.message || 'Failed to load personal calculation history');
    } finally {
      setHistoryLoading(false);
    }
  }, [isConfigured, user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSaveCalculation = async () => {
    if (!isConfigured || !supabase || !user) {
      alert('Please sign in to save your calculation history.');
      return;
    }

    try {
      setHistoryError(null);
      const { error } = await supabase.from('personal_calculations').insert([
        {
          user_id: user.id, // Strictly matched to auth.uid() by RLS
          activity_type: 'COMMUTE',
          input_parameters: {
            commuteMiles,
            commuteMode,
            labHours,
          },
          calculated_kg_co2: parseFloat(totalDailyCo2e.toFixed(4)),
        },
      ]);

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadHistory();
    } catch (err: any) {
      setHistoryError(err?.message || 'Failed to save calculation');
    }
  };

  const handleDeleteCalculation = async (calcId: string) => {
    if (!isConfigured || !supabase || !user) return;
    try {
      const { error } = await supabase
        .from('personal_calculations')
        .delete()
        .eq('id', calcId); // RLS guarantees user can only delete their own records

      if (error) throw error;
      loadHistory();
    } catch (err: any) {
      setHistoryError(err?.message || 'Failed to delete record');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
        <h2 style={{ marginTop: 0 }}>Student & Faculty Carbon Footprint Calculator</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Estimate your personal daily campus operational footprint based on your commute and workstation usage.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Daily Commute (Miles round-trip): {commuteMiles} mi
            </label>
            <input
              type="range"
              min="0"
              max="40"
              value={commuteMiles}
              onChange={(e) => setCommuteMiles(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Commute Mode
            </label>
            <select
              value={commuteMode}
              onChange={(e) => setCommuteMode(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
            >
              <option value="car">Gasoline Car (0.385 kg/mi)</option>
              <option value="ev">Electric Vehicle (0.110 kg/mi)</option>
              <option value="transit">Campus Shuttle / Bus (0.075 kg/mi)</option>
              <option value="bike">Bicycle / Walking (0 kg/mi)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Computer Lab Hours: {labHours} hrs
            </label>
            <input
              type="range"
              min="0"
              max="12"
              value={labHours}
              onChange={(e) => setLabHours(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Estimated Daily Campus Footprint</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', margin: '0.5rem 0' }}>
            {totalDailyCo2e.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>kg CO2e / day</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
            Switching to the campus shuttle bus would save {(commuteMiles * (modeFactors.car - modeFactors.transit)).toFixed(2)} kg CO2e daily!
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center' }}>
            {user ? (
              <button
                onClick={handleSaveCalculation}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                {saveSuccess ? '✓ Saved to Your History' : 'Save to My Supabase History'}
              </button>
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '4px' }}>
                🔒 Sign in with Supabase to save your personal calculation history
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Supabase RLS Personal History Section */}
      {user && (
        <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>My Saved Calculations</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Protected by PostgreSQL RLS (Only you can read or delete your entries)
              </span>
            </div>
            <button
              onClick={loadHistory}
              disabled={historyLoading}
              style={{ background: 'none', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              {historyLoading ? 'Loading...' : 'Refresh History'}
            </button>
          </div>

          {historyError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
              ⚠️ {historyError}
            </div>
          )}

          {savedHistory.length === 0 && !historyLoading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              No saved calculation entries yet. Click "Save to My Supabase History" above to store an entry.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {savedHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <strong>{item.calculated_kg_co2} kg CO2e/day</strong> — {item.input_parameters?.commuteMiles} mi via {item.input_parameters?.commuteMode}, {item.input_parameters?.labHours}h lab
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCalculation(item.id)}
                    style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
