import React, { useState } from 'react';
import { Building2, AlertTriangle, CheckCircle2, Zap, Users, ShieldAlert, Cpu } from 'lucide-react';

export default function RoomStatusInterface({ rooms = [], equipment = [], observations = [], analytics = null }) {
  const [selectedRoomId, setSelectedRoomId] = useState(() => rooms[0]?.id || 'ROOM-SCI-204');

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];
  const roomEq = equipment.filter(e => e.room_id === selectedRoom?.id);

  // Latest observation
  const roomObs = observations.filter(o => o.room_id === selectedRoom?.id)
    .sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at))[0] || { people_detected: 0, coverage: 0.95 };

  const activeWatts = roomEq.filter(e => e.declared_state === 'ON').reduce((s, e) => s + (e.rated_power_w * e.quantity), 0);
  const activeKw = (activeWatts / 1000).toFixed(2);
  const isVacant = (roomObs.people_detected || 0) === 0;
  const isWasteful = isVacant && activeWatts > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header and Room Selector */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Building2 size={16} />
            Secondary Station • Room Status & Subsystem Inspection
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0' }}>
            {selectedRoom?.name || 'Select Facility Room'}
          </h2>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Building: <strong>{selectedRoom?.building_name}</strong> | Design Capacity: <strong>{selectedRoom?.capacity} occupants</strong> | Room ID: <code>{selectedRoom?.id}</code>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#475569' }}>Inspect Room:</label>
          <select
            value={selectedRoom?.id || ''}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#0f172a',
              background: '#f8fafc'
            }}
          >
            {rooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.building_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Anomaly Banner */}
      {isWasteful ? (
        <div style={{
          background: '#fff1f2',
          border: '1px solid #fecdd3',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ padding: '0.6rem', background: '#ffe4e6', borderRadius: '50%' }}>
            <ShieldAlert size={28} color="#e11d48" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#9f1239', fontSize: '1.05rem' }}>
              Anomaly Flagged: WASTEFUL VACANCY DETECTED
            </div>
            <div style={{ fontSize: '0.875rem', color: '#be123c', marginTop: '0.2rem' }}>
              Room is completely vacant (<strong>0 occupants</strong> confirmed via zero-PII camera sensor with {Math.round((roomObs.coverage || 0.95) * 100)}% coverage), but <strong>{activeKw} kW</strong> of subsystem equipment remains continuously energized.
            </div>
          </div>
        </div>
      ) : isVacant ? (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <CheckCircle2 size={24} color="#16a34a" />
          <div>
            <div style={{ fontWeight: 700, color: '#166534', fontSize: '1rem' }}>
              Optimal Standby State
            </div>
            <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
              Room is vacant and non-essential loads are safely powered down.
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Users size={24} color="#2563eb" />
          <div>
            <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '1rem' }}>
              Productive Active Occupancy: {roomObs.people_detected} Occupants
            </div>
            <div style={{ fontSize: '0.85rem', color: '#1d4ed8' }}>
              Subsystems are actively serving room occupants. Current active load: {activeKw} kW.
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="carbon-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>LIVE OCCUPANCY</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
            {roomObs.people_detected || 0} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {selectedRoom?.capacity}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669' }}>
            Anonymous Edge AI Headcount
          </div>
        </div>

        <div className="carbon-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>ACTIVE POWER DRAW</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
            {activeKw} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>kW</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {roomEq.filter(e => e.declared_state === 'ON').length} active subsystem loads
          </div>
        </div>

        <div className="carbon-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>HOURLY SCOPE 2 EMISSIONS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isWasteful ? '#e11d48' : '#0f172a', margin: '0.25rem 0' }}>
            {(parseFloat(activeKw) * 0.4412).toFixed(2)} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>kg CO₂e/h</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Grid factor: 0.4412 kg CO₂e/kWh
          </div>
        </div>

        <div className="carbon-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>SENSOR RELIABILITY</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', margin: '0.25rem 0' }}>
            {Math.round((roomObs.coverage || 0.95) * 100)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Local MediaPipe Optical Feed
          </div>
        </div>
      </div>

      {/* Subsystem Equipment Table */}
      <div className="carbon-card" style={{ overflowX: 'auto', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Subsystem Equipment & Load Breakdown
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total connected equipment: <strong>{roomEq.length} items</strong>
          </span>
        </div>

        <table className="carbon-table">
          <thead>
            <tr>
              <th>Equipment Name</th>
              <th>Rated Power</th>
              <th>Qty</th>
              <th>Total Load</th>
              <th>Classification</th>
              <th>Safety Exclusion</th>
              <th>Operating State</th>
            </tr>
          </thead>
          <tbody>
            {roomEq.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No equipment registered for this room yet.
                </td>
              </tr>
            ) : (
              roomEq.map(eq => {
                const totalW = eq.rated_power_w * eq.quantity;
                return (
                  <tr key={eq.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{eq.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {eq.id}</div>
                    </td>
                    <td className="tabular-nums">{eq.rated_power_w} W</td>
                    <td style={{ fontWeight: 600 }}>{eq.quantity}</td>
                    <td className="tabular-nums" style={{ fontWeight: 700 }}>
                      {(totalW / 1000).toFixed(2)} kW
                    </td>
                    <td>
                      {eq.nonessential ? (
                        <span className="pill pill-indigo">Non-Essential</span>
                      ) : (
                        <span className="pill pill-slate">Essential Base</span>
                      )}
                    </td>
                    <td>
                      {eq.safety_exclusion ? (
                        <span className="pill pill-rose">Protected</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Controllable</span>
                      )}
                    </td>
                    <td>
                      {eq.declared_state === 'ON' ? (
                        <span className="pill pill-emerald"><Zap size={12} /> ACTIVE</span>
                      ) : (
                        <span className="pill pill-slate">STANDBY</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
