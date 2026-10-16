import React, { useState } from 'react';
import { Layers, Activity, Maximize2, ShieldCheck, Box } from 'lucide-react';

/* =========================================================================
   OPTIONAL: FUTURE IMPORT OF ROOMS TWIN MODEL COMPONENT
   When ready, create and import your component here:
   import RoomsTwinModel from './RoomsTwinModel';
   ========================================================================= */

export default function LiveRoomsTwinPage() {
  const [selectedRoom, setSelectedRoom] = useState('ROOM-LIB-100');
  const [zoomLevel, setZoomLevel] = useState(100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Top Header Card */}
      <div style={{
        backgroundColor: '#ffffff',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              className="animate-pulse-live"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'inline-block',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Telemetry & Spatial Twin
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Live Rooms Twin
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Room twin model will appear here
          </p>
        </div>

        {/* Room selector and controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <Box size={14} color="#64748b" />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Room:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontWeight: 600, fontSize: '0.825rem', color: '#0f172a', outline: 'none' }}
            >
              <option value="ROOM-LIB-100">Main Reading Room (ROOM-LIB-100)</option>
              <option value="ROOM-SCI-204">Physics Lecture Hall 204</option>
              <option value="ROOM-SCI-101">Bio-Lab 101</option>
              <option value="ROOM-ENG-220">Computer Architecture Lab</option>
              <option value="ROOM-ENG-110">Robotics Studio</option>
              <option value="ROOM-SCI-302">Chemistry Seminar 302</option>
              <option value="ROOM-ENG-401">Graduate Research Suite</option>
              <option value="ROOM-LIB-205">Group Study Pod B</option>
            </select>
          </div>

          <div style={{
            background: '#09231d',
            border: '1px solid #14493b',
            borderRadius: '6px',
            padding: '0.35rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: '#a7f3d0'
          }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Zero-PII Spatial Feed</span>
          </div>
        </div>
      </div>

      {/* Main Container Sized for the Rooms Twin Model */}
      <div style={{
        backgroundColor: '#0b1320',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        minHeight: '560px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Model canvas header overlay */}
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#e2e8f0',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={16} color="#38bdf8" />
            <span style={{ fontWeight: 600 }}>Top-Down Furnished Spatial Canvas</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#94a3b8' }}>Perspective: Orthographic 2.5D</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} color="#10b981" /> Camera-Synced Model
            </span>
            <span>Zoom: {zoomLevel}%</span>
          </div>
        </div>

        {/* =========================================================================
            ROOMS TWIN MODEL COMPONENT SLOT
            When ready to plug in the top-down furnished floor plan fed by the camera,
            import your component and replace the placeholder below with:
            <RoomsTwinModel roomId={selectedRoom} />
           ========================================================================= */}
        <div style={{
          flex: 1,
          minHeight: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'radial-gradient(circle at center, #111d33 0%, #080d17 100%)',
          position: 'relative'
        }}>
          {/* Subtle blueprint grid lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(56, 189, 248, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56, 189, 248, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            pointerEvents: 'none'
          }} />

          {/* Clean Model Reserved Area Placeholder Card */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '620px',
            width: '100%',
            textAlign: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px dashed #334155',
            borderRadius: '12px',
            padding: '2.5rem 2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              border: '1px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#38bdf8'
            }}>
              <Box size={30} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Live Rooms Twin Model Slot
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Room twin model will appear here. This dedicated viewport is configured for the top-down furnished floor plan, real-time occupant markers, and equipment heatmaps fed directly by edge vision sensors.
            </p>

            {/* Integration helper badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#07271e',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontFamily: 'monospace'
            }}>
              <code>&lt;RoomsTwinModel roomId="{selectedRoom}" /&gt;</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
