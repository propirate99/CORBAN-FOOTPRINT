import React, { useState } from 'react';
import { ActionItem } from '../../types/api';

const MOCK_ACTIONS: ActionItem[] = [];

export const ActionTimeline: React.FC = () => {
  const [actions, setActions] = useState<ActionItem[]>(MOCK_ACTIONS);

  const handleApprove = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'EXECUTED' } : a))
    );
  };

  return (
    <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
      <h2 style={{ marginTop: 0 }}>Mitigation Actions & Automated Workflow</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
        Rule-triggered proposals with AI reasoning for facilities operators to review and execute.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        {actions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>No Pending Mitigation Actions</h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              All mock actions have been purged. When active loads are verified in vacant rooms, automated mitigation proposals will appear here for review and execution.
            </p>
          </div>
        ) : (
          actions.map((action) => (
            <div
              key={action.id}
              style={{
                padding: '1.25rem',
                borderRadius: '0.5rem',
                border: `1px solid ${action.status === 'PENDING_APPROVAL' ? '#fbbf24' : '#e2e8f0'}`,
                background: action.status === 'PENDING_APPROVAL' ? '#fffdf7' : '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{action.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{action.roomName} • {action.roomId}</div>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: action.status === 'PENDING_APPROVAL' ? '#fef3c7' : '#dcfce7',
                    color: action.status === 'PENDING_APPROVAL' ? '#92400e' : '#166534',
                  }}
                >
                  {action.status}
                </span>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#334155', margin: '0.75rem 0' }}>{action.description}</p>

              <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#1e40af', marginBottom: '0.75rem' }}>
                🤖 <strong>AI Explanation:</strong> {action.explanation}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669' }}>
                  Est. Savings: {action.estimatedHourlyCo2eSavedKg.toFixed(2)} kg CO2e/h
                </span>
                {action.status === 'PENDING_APPROVAL' && (
                  <button
                    onClick={() => handleApprove(action.id)}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Approve & Execute
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
