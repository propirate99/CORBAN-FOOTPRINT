import React, { useState } from 'react';
import { ActionItem } from '../../types/api';

const MOCK_ACTIONS: ActionItem[] = [
  {
    id: 'ACT-001',
    roomId: 'ROOM-SCI-204',
    roomName: 'Physics Lecture Hall 204',
    title: 'Eco-Mode HVAC Setback',
    description: 'Reduce VAV supply fan to 30% and raise cooling setpoint by 2.5°C during 0-occupant state.',
    explanation: 'Room SCI-204 has been empty since 09:45 AM. Edge camera verified 0 occupants with 94% confidence. Executing this setback saves 2.6 kW without impacting scheduled classes.',
    estimatedHourlyCo2eSavedKg: 1.12,
    status: 'PENDING_APPROVAL',
    createdAt: '2026-10-15T10:15:00Z',
  },
  {
    id: 'ACT-002',
    roomId: 'ROOM-ENG-220',
    roomName: 'Computer Architecture Lab',
    title: 'Workstation Idle Power-Down',
    description: 'Transition 30 idle CAD workstations to S3 sleep state.',
    explanation: 'Class ended 45 minutes ago. Workstations drawing 4.5 kW while idle.',
    estimatedHourlyCo2eSavedKg: 1.85,
    status: 'EXECUTED',
    createdAt: '2026-10-15T09:30:00Z',
  },
];

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
        {actions.map((action) => (
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
        ))}
      </div>
    </div>
  );
};
