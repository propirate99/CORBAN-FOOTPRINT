import React from 'react';
import { PLAN_CONFIG } from '../config/plan.config';
import { TWIN_CONFIG } from '../config/twinConfig';

/**
 * Architectural Top-Down 2D Floor Plan SVG (MagicPlan / Floorplanner style).
 * Renders floor textures, CAD walls, door swing arcs, windows, furniture symbols,
 * toggleable energy washes, camera FOV cones, and vision-detected occupant dots.
 */
export default function ArchitecturalPlanSvg({
  rooms,
  selectedId,
  onSelectRoom,
  layers, // { plan: boolean, energy: boolean, cameras: boolean, people: boolean }
  editMode,
  onPlanClickCoordinate,
  lab1Detections = [], // real vision bounding boxes [{ bbox: [x,y,w,h], score, class }]
  isCameraActive = false,
  onOpenPip
}) {
  const { width, height, rooms: planRooms, corridor } = PLAN_CONFIG;

  // Helper to get runtime room telemetry
  const getRoomRuntime = (id) => rooms.find(r => r.id === id) || {};

  return (
    <svg
      id="architectural-plan"
      className="architectural-plan-svg"
      viewBox={`0 0 ${width} ${height}`}
      onClick={(e) => {
        if (editMode && onPlanClickCoordinate) {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const pctX = ((clickX / rect.width) * 100).toFixed(1);
          const pctY = ((clickY / rect.height) * 100).toFixed(1);
          const svgX = Math.round((clickX / rect.width) * width);
          const svgY = Math.round((clickY / rect.height) * height);
          onPlanClickCoordinate({ pctX, pctY, svgX, svgY });
        }
      }}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        cursor: editMode ? 'crosshair' : 'default',
        userSelect: 'none'
      }}
    >
      {/* 1. ARCHITECTURAL PATTERNS & SYMBOLS DEFS */}
      <defs>
        {/* Parquet Pattern (Hardwood herringbone / parquet blocks) */}
        <pattern id="pat-parquet" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#edd7bf" />
          <rect x="0" y="0" width="20" height="10" fill="#dfc3a4" stroke="#cbb092" strokeWidth="0.6" />
          <rect x="0" y="10" width="20" height="10" fill="#e9ceb0" stroke="#cbb092" strokeWidth="0.6" />
          <rect x="20" y="0" width="10" height="20" fill="#d8bc9d" stroke="#cbb092" strokeWidth="0.6" />
          <rect x="30" y="0" width="10" height="20" fill="#e5c8aa" stroke="#cbb092" strokeWidth="0.6" />
          <rect x="0" y="20" width="10" height="20" fill="#d8bc9d" stroke="#cbb092" strokeWidth="0.6" />
          <rect x="10" y="20" width="10" height="20" fill="#e5c8aa" stroke="#cbb092" strokeWidth="0.6" />
          <rect x="20" y="20" width="20" height="10" fill="#dfc3a4" stroke="#cbb092" strokeWidth="0.6" />
          <rect x="20" y="30" width="20" height="10" fill="#e9ceb0" stroke="#cbb092" strokeWidth="0.6" />
        </pattern>

        {/* Ceramic Tile Pattern */}
        <pattern id="pat-tile" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#e6dfd5" stroke="#cec6b8" strokeWidth="0.8" />
          <rect x="1" y="1" width="22" height="22" fill="#f4efe6" />
        </pattern>

        {/* Checkered Canteen Tile Pattern */}
        <pattern id="pat-canteen-tile" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#e7ded5" />
          <rect x="0" y="0" width="14" height="14" fill="#faf4ed" stroke="#d5c8bb" strokeWidth="0.5" />
          <rect x="14" y="14" width="14" height="14" fill="#faf4ed" stroke="#d5c8bb" strokeWidth="0.5" />
          <rect x="14" y="0" width="14" height="14" fill="#dfd0c1" stroke="#d5c8bb" strokeWidth="0.5" />
          <rect x="0" y="14" width="14" height="14" fill="#dfd0c1" stroke="#d5c8bb" strokeWidth="0.5" />
        </pattern>

        {/* Polished Concrete Stipple Pattern for Lab 1 */}
        <pattern id="pat-concrete" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#d8dce2" />
          <circle cx="6" cy="8" r="0.8" fill="#abb4be" />
          <circle cx="18" cy="4" r="0.6" fill="#8f99a5" />
          <circle cx="26" cy="18" r="0.9" fill="#abb4be" />
          <circle cx="12" cy="24" r="0.7" fill="#8f99a5" />
          <circle cx="28" cy="28" r="0.5" fill="#bcc4ce" />
        </pattern>

        {/* Fine Woven Carpet Pattern for Library */}
        <pattern id="pat-carpet" width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill="#cbd6d7" />
          <rect x="0" y="0" width="9" height="9" fill="#c2cecf" />
          <rect x="9" y="9" width="9" height="9" fill="#c2cecf" />
          <circle cx="4.5" cy="4.5" r="0.6" fill="#9fb3b4" />
          <circle cx="13.5" cy="13.5" r="0.6" fill="#9fb3b4" />
        </pattern>

        {/* Camera FOV Radial Cone Gradient */}
        <radialGradient id="cam-cone-fov" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
        </radialGradient>

        <radialGradient id="cam-cone-live" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#f87171" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
        </radialGradient>

        {/* Soft shadow for furniture and chips */}
        <filter id="chip-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.15" />
        </filter>
        <filter id="furniture-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="1" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.12" />
        </filter>

        {/* --- REUSABLE FURNITURE CAD SYMBOLS --- */}

        {/* Workstation Desk with Monitor & Ergonomic Chair */}
        <g id="sym-desk-pc" filter="url(#furniture-shadow)">
          {/* Desk surface */}
          <rect x="-24" y="-14" width="48" height="28" rx="2" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
          {/* Monitor with stand */}
          <rect x="-14" y="-11" width="28" height="4" rx="1" fill="#1e293b" />
          <line x1="-3" y1="-7" x2="3" y2="-7" stroke="#475569" strokeWidth="2" />
          {/* Keyboard */}
          <rect x="-10" y="-3" width="20" height="7" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.6" />
          {/* Mouse */}
          <rect x="13" y="-1" width="3" height="5" rx="1.5" fill="#94a3b8" />
          {/* Chair top-down */}
          <ellipse cx="0" cy="20" rx="8" ry="7" fill="#334155" />
          <path d="M -9 22 C -9 15, 9 15, 9 22" fill="none" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="0" cy="20" r="2.5" fill="#64748b" />
        </g>

        {/* Lab Workbench with Sinks and Equip */}
        <g id="sym-lab-bench" filter="url(#furniture-shadow)">
          <rect x="-16" y="-55" width="32" height="110" rx="2" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
          <rect x="-11" y="-45" width="22" height="26" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          <circle cx="0" cy="-32" r="3" fill="#64748b" />
          <line x1="-16" y1="0" x2="16" y2="0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
          <rect x="-11" y="20" width="22" height="26" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          <circle cx="0" cy="33" r="3" fill="#64748b" />
        </g>

        {/* Double-sided Bookshelf for Library */}
        <g id="sym-bookshelf" filter="url(#furniture-shadow)">
          <rect x="-14" y="-45" width="28" height="90" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
          <line x1="0" y1="-45" x2="0" y2="45" stroke="#78350f" strokeWidth="1" />
          {/* Book dividers */}
          {[-35, -25, -15, -5, 5, 15, 25, 35].map(yy => (
            <React.Fragment key={yy}>
              <line x1="-14" y1={yy} x2="0" y2={yy} stroke="#d97706" strokeWidth="0.8" />
              <line x1="0" y1={yy + 5} x2="14" y2={yy + 5} stroke="#d97706" strokeWidth="0.8" />
            </React.Fragment>
          ))}
        </g>

        {/* Library Reading Table with 4 Chairs */}
        <g id="sym-reading-table" filter="url(#furniture-shadow)">
          <rect x="-35" y="-18" width="70" height="36" rx="3" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.2" />
          {/* Center divider lamp */}
          <line x1="-30" y1="0" x2="30" y2="0" stroke="#059669" strokeWidth="1.5" />
          {/* Chairs top */}
          <ellipse cx="-18" cy="-24" rx="7" ry="5" fill="#475569" />
          <ellipse cx="18" cy="-24" rx="7" ry="5" fill="#475569" />
          {/* Chairs bottom */}
          <ellipse cx="-18" cy="24" rx="7" ry="5" fill="#475569" />
          <ellipse cx="18" cy="24" rx="7" ry="5" fill="#475569" />
        </g>

        {/* Auditorium / Seminar Row of 5 Seats */}
        <g id="sym-seats-row" filter="url(#furniture-shadow)">
          {[0, 36, 72, 108, 144].map(xx => (
            <g key={xx} transform={`translate(${xx}, 0)`}>
              <rect x="-14" y="-10" width="28" height="20" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
              {/* Backrest cushion */}
              <rect x="-12" y="-9" width="24" height="6" rx="2" fill="#334155" />
              {/* Seat cushion */}
              <rect x="-11" y="-1" width="22" height="9" rx="2" fill="#475569" />
              {/* Armrests */}
              <rect x="-15" y="-6" width="3" height="14" rx="1.5" fill="#64748b" />
              <rect x="12" y="-6" width="3" height="14" rx="1.5" fill="#64748b" />
            </g>
          ))}
        </g>

        {/* Seminar Stage & Presenter Rostrum */}
        <g id="sym-stage-podium" filter="url(#furniture-shadow)">
          {/* Elevated Stage Platform */}
          <rect x="-80" y="-16" width="160" height="32" rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
          {/* Lectern */}
          <rect x="-12" y="-10" width="24" height="16" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
          <rect x="-7" y="-7" width="14" height="10" fill="#f8fafc" />
          {/* Projection Screen on wall */}
          <rect x="-60" y="-18" width="120" height="4" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
        </g>

        {/* Boardroom Oval Conference Table with 6 Chairs */}
        <g id="sym-meeting-table-oval" filter="url(#furniture-shadow)">
          <rect x="-50" y="-22" width="100" height="44" rx="22" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
          <ellipse cx="0" cy="0" rx="25" ry="9" fill="#d97706" opacity="0.4" />
          {/* 6 Executive chairs */}
          <ellipse cx="-30" cy="-30" rx="8" ry="6" fill="#1e293b" />
          <ellipse cx="0" cy="-30" rx="8" ry="6" fill="#1e293b" />
          <ellipse cx="30" cy="-30" rx="8" ry="6" fill="#1e293b" />
          <ellipse cx="-30" cy="30" rx="8" ry="6" fill="#1e293b" />
          <ellipse cx="0" cy="30" rx="8" ry="6" fill="#1e293b" />
          <ellipse cx="30" cy="30" rx="8" ry="6" fill="#1e293b" />
        </g>

        {/* 3-Seater Staff Lounge Sofa */}
        <g id="sym-sofa-3seat" filter="url(#furniture-shadow)">
          <rect x="-16" y="-38" width="32" height="76" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
          {/* Cushions */}
          <rect x="-12" y="-34" width="22" height="22" rx="3" fill="#475569" />
          <rect x="-12" y="-11" width="22" height="22" rx="3" fill="#475569" />
          <rect x="-12" y="12" width="22" height="22" rx="3" fill="#475569" />
        </g>

        {/* Cafeteria 4-Seater Dining Table */}
        <g id="sym-dining-table-4" filter="url(#furniture-shadow)">
          <rect x="-24" y="-24" width="48" height="48" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Chairs */}
          <circle cx="0" cy="-32" r="7" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          <circle cx="0" cy="32" r="7" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          <circle cx="-32" cy="0" r="7" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          <circle cx="32" cy="0" r="7" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
        </g>

        {/* Top-Down Botanical Potted Plant */}
        <g id="sym-plant" filter="url(#furniture-shadow)">
          <circle cx="0" cy="0" r="12" fill="#78350f" stroke="#451a03" strokeWidth="1" />
          {/* Leaves radiating */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-11"
              rx="4.5"
              ry="9"
              fill="#15803d"
              stroke="#14532d"
              strokeWidth="0.8"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="4" fill="#14532d" />
        </g>

        {/* Server Rack */}
        <g id="sym-server-rack" filter="url(#furniture-shadow)">
          <rect x="-14" y="-18" width="28" height="36" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <line x1="-10" y1="-8" x2="10" y2="-8" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,2" />
          <line x1="-10" y1="0" x2="10" y2="0" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,2" />
          <line x1="-10" y1="8" x2="10" y2="8" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,2" />
        </g>

        {/* Instructor Desk */}
        <g id="sym-instructor-desk" filter="url(#furniture-shadow)">
          <rect x="-18" y="-36" width="36" height="72" rx="3" fill="#f8fafc" stroke="#64748b" strokeWidth="1.4" />
          <rect x="-10" y="-12" width="20" height="24" rx="2" fill="#1e293b" />
          <circle cx="28" cy="0" r="8" fill="#334155" />
        </g>
      </defs>

      {/* 2. OPTIONAL BACKGROUND IMAGE (If /public/plan.png exists) */}
      {PLAN_CONFIG.backgroundImage && (
        <image
          href={PLAN_CONFIG.backgroundImage}
          x="0"
          y="0"
          width={width}
          height={height}
          preserveAspectRatio="none"
          onError={(e) => {
            // Silently hide image if plan.png is not present
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {/* 3. BASE ARCHITECTURAL FLOOR LAYER (TEXTURES) */}
      {layers.plan && (
        <g id="layer-floor-textures">
          {/* Corridor Texture */}
          <polygon
            points={corridor.polygon.map(p => `${p.x},${p.y}`).join(' ')}
            fill="url(#pat-tile)"
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Room Base Floor Textures */}
          {planRooms.map(r => {
            let fillUrl = 'url(#pat-parquet)';
            if (r.floorType === 'concrete') fillUrl = 'url(#pat-concrete)';
            else if (r.floorType === 'tile') fillUrl = 'url(#pat-tile)';
            else if (r.floorType === 'tile_checkered') fillUrl = 'url(#pat-canteen-tile)';
            else if (r.floorType === 'carpet') fillUrl = 'url(#pat-carpet)';

            return (
              <polygon
                key={`floor-${r.id}`}
                points={r.polygon.map(p => `${p.x},${p.y}`).join(' ')}
                fill={fillUrl}
              />
            );
          })}
        </g>
      )}

      {/* 4. FURNITURE CAD SYMBOLS LAYER */}
      {layers.plan && (
        <g id="layer-furniture">
          {planRooms.map(r => (
            <g key={`furn-group-${r.id}`}>
              {r.furniture.map((item, fIdx) => {
                let symbolHref = '#sym-desk-pc';
                if (item.type === 'lab_bench') symbolHref = '#sym-lab-bench';
                else if (item.type === 'bookshelf_double') symbolHref = '#sym-bookshelf';
                else if (item.type === 'reading_table') symbolHref = '#sym-reading-table';
                else if (item.type === 'seats_row') symbolHref = '#sym-seats-row';
                else if (item.type === 'stage_podium') symbolHref = '#sym-stage-podium';
                else if (item.type === 'meeting_table_oval') symbolHref = '#sym-meeting-table-oval';
                else if (item.type === 'sofa_3seat') symbolHref = '#sym-sofa-3seat';
                else if (item.type === 'dining_table_4') symbolHref = '#sym-dining-table-4';
                else if (item.type === 'plant') symbolHref = '#sym-plant';
                else if (item.type === 'server_rack') symbolHref = '#sym-server-rack';
                else if (item.type === 'instructor_desk') symbolHref = '#sym-instructor-desk';

                return (
                  <use
                    key={`furn-${r.id}-${fIdx}`}
                    href={symbolHref}
                    x={item.x}
                    y={item.y}
                    transform={
                      item.rotation || item.scale
                        ? `rotate(${item.rotation || 0}, ${item.x}, ${item.y}) scale(${item.scale || 1})`
                        : undefined
                    }
                  />
                );
              })}
            </g>
          ))}
        </g>
      )}

      {/* 5. WALLS, DOORS & WINDOWS (Thick Dark MagicPlan Outline) */}
      {layers.plan && (
        <g id="layer-walls-and-openings">
          {/* Room perimeter & partition walls */}
          {planRooms.map(r => (
            <polygon
              key={`wall-${r.id}`}
              points={r.polygon.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#1e293b"
              strokeWidth="9"
              strokeLinejoin="round"
            />
          ))}

          {/* Corridor enclosing dividing lines */}
          <line x1="30" y1="280" x2="970" y2="280" stroke="#1e293b" strokeWidth="8" />
          <line x1="30" y1="350" x2="970" y2="350" stroke="#1e293b" strokeWidth="8" />

          {/* Window Marks on Exterior Walls */}
          {planRooms.map(r => (
            <g key={`win-group-${r.id}`}>
              {r.windows.map((win, wIdx) => {
                const isHoriz = win.orientation === 'horizontal';
                const x1 = isHoriz ? win.x : win.x;
                const y1 = isHoriz ? win.y : win.y;
                const x2 = isHoriz ? win.x + win.length : win.x;
                const y2 = isHoriz ? win.y : win.y + win.length;

                return (
                  <g key={`win-${r.id}-${wIdx}`}>
                    {/* Cut out black wall */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeWidth="9" />
                    {/* Window framing & glass panes */}
                    <line x1={x1} y1={y1 - 2} x2={x2} y2={y2 - 2} stroke="#38bdf8" strokeWidth="2.5" />
                    <line x1={x1} y1={y1 + 2} x2={x2} y2={y2 + 2} stroke="#38bdf8" strokeWidth="2.5" />
                    {/* Wall jamb ends */}
                    <line x1={x1} y1={y1 - 4} x2={x1} y2={y1 + 4} stroke="#1e293b" strokeWidth="3" />
                    <line x1={x2} y1={y2 - 4} x2={x2} y2={y2 + 4} stroke="#1e293b" strokeWidth="3" />
                  </g>
                );
              })}
            </g>
          ))}

          {/* Doors & Quarter-Circle Swing Arcs */}
          {planRooms.map(r => (
            <g key={`doors-group-${r.id}`}>
              {r.doors.map((door, dIdx) => {
                const dw = door.width;
                const dx = door.x;
                const dy = door.y;
                const isTopDoor = door.angle === 90; // Top row entering from corridor

                return (
                  <g key={`door-${r.id}-${dIdx}`}>
                    {/* Clear wall opening */}
                    <line
                      x1={dx}
                      y1={dy}
                      x2={dx + dw}
                      y2={dy}
                      stroke="#ffffff"
                      strokeWidth="11"
                    />
                    {/* Door jamb caps */}
                    <rect x={dx - 2} y={dy - 5} width="4" height="10" fill="#1e293b" />
                    <rect x={dx + dw - 2} y={dy - 5} width="4" height="10" fill="#1e293b" />

                    {/* Door Leaf (panel swung open into room) */}
                    <line
                      x1={dx}
                      y1={dy}
                      x2={dx}
                      y2={isTopDoor ? dy - dw : dy + dw}
                      stroke="#78350f"
                      strokeWidth="3"
                    />

                    {/* Quarter-circle swing arc (dashed architectural curve) */}
                    <path
                      d={
                        isTopDoor
                          ? `M ${dx + dw} ${dy} A ${dw} ${dw} 0 0 0 ${dx} ${dy - dw}`
                          : `M ${dx + dw} ${dy} A ${dw} ${dw} 0 0 1 ${dx} ${dy + dw}`
                      }
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.2"
                      strokeDasharray="3,3"
                    />
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      )}

      {/* 6. ROOM LABELS & AREAS (Centered MagicPlan style) */}
      {layers.plan && (
        <g id="layer-labels">
          {planRooms.map(r => {
            const runtime = getRoomRuntime(r.id);
            const isSelected = r.id === selectedId;

            return (
              <g
                key={`label-${r.id}`}
                transform={`translate(${r.labelPos.x}, ${r.labelPos.y})`}
                style={{ pointerEvents: 'none' }}
              >
                <text
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="15"
                  fontWeight="800"
                  letterSpacing="-0.01em"
                >
                  {r.name}
                </text>
                <text
                  y="18"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="12"
                  fontWeight="600"
                >
                  {r.code} • {r.area} m²
                </text>
              </g>
            );
          })}

          {/* Corridor Label */}
          <text
            x="500"
            y="319"
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontWeight="700"
            letterSpacing="0.12em"
            opacity="0.85"
            style={{ pointerEvents: 'none' }}
          >
            CENTRAL CORRIDOR (CIRCULATION) • 34.5 m²
          </text>
        </g>
      )}

      {/* 7. ENERGY OVERLAY LAYER (Translucent Color Wash + Room Telemetry Chips) */}
      {layers.energy && (
        <g id="layer-energy">
          {planRooms.map(r => {
            const runtime = getRoomRuntime(r.id);
            const status = runtime.status || 'ok';
            const isSelected = r.id === selectedId;

            let fillColor = 'rgba(16, 185, 129, 0.28)'; // Green Normal
            let strokeColor = '#10b981';
            let pulseClass = '';

            if (status === 'warn') {
              fillColor = 'rgba(245, 158, 11, 0.38)'; // Amber Warning
              strokeColor = '#f59e0b';
            } else if (status === 'leak') {
              fillColor = 'rgba(239, 68, 68, 0.45)'; // Red Leak
              strokeColor = '#ef4444';
              pulseClass = 'twin-leak-pulse';
            }

            return (
              <g key={`energy-zone-${r.id}`}>
                {/* Room Wash Polygon */}
                <polygon
                  points={r.polygon.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={fillColor}
                  stroke={isSelected ? '#047857' : strokeColor}
                  strokeWidth={isSelected ? 6 : 2.5}
                  className={status === 'leak' ? pulseClass : ''}
                  style={{
                    cursor: 'pointer',
                    transition: 'fill 0.25s ease, stroke-width 0.15s ease'
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${r.name}: ${runtime.kw ? runtime.kw.toFixed(1) : 0} kW, ${runtime.people || 0} occupants, status: ${TWIN_CONFIG.STATUS_LABELS[status]}`}
                  onClick={() => onSelectRoom && onSelectRoom(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectRoom && onSelectRoom(r.id);
                    }
                  }}
                />

                {/* Floating Architectural Telemetry Chip */}
                <g
                  transform={`translate(${r.chipPos.x}, ${r.chipPos.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectRoom && onSelectRoom(r.id)}
                >
                  {/* Glassmorphism Chip Pill */}
                  <rect
                    x="-68"
                    y="-20"
                    width="136"
                    height="40"
                    rx="8"
                    fill="#ffffff"
                    stroke={isSelected ? '#059669' : '#e2e8f0'}
                    strokeWidth={isSelected ? 2.5 : 1}
                    filter="url(#chip-shadow)"
                  />

                  {/* Status Indicator Dot */}
                  <circle
                    cx="-54"
                    cy="0"
                    r="5"
                    fill={status === 'leak' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#10b981'}
                  />

                  {/* kW Metric */}
                  <text
                    x="-42"
                    y="-2"
                    fill="#0f172a"
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {(runtime.kw || 0).toFixed(1)} kW
                  </text>

                  {/* Occupant count & status */}
                  <text
                    x="-42"
                    y="13"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {runtime.people || 0} {runtime.people === 1 ? 'person' : 'ppl'} • {status === 'leak' ? 'LEAK' : status === 'warn' ? 'IDLE' : 'OK'}
                  </text>

                  {/* Selected badge */}
                  {isSelected && (
                    <polygon
                      points="60,-12 68,-12 68,-4"
                      fill="#059669"
                    />
                  )}
                </g>
              </g>
            );
          })}
        </g>
      )}

      {/* 8. CAMERAS & FOV CONES LAYER */}
      {layers.cameras && (
        <g id="layer-cameras">
          {planRooms.map(r => {
            const cam = r.camera;
            if (!cam) return null;

            const isLab1 = r.id === 'room_1';
            const liveActive = isLab1 && isCameraActive;

            // Generate SVG wedge for FOV Cone
            const fovRad = (cam.fov * Math.PI) / 180;
            const startAngleRad = ((cam.angle - cam.fov / 2) * Math.PI) / 180;
            const endAngleRad = ((cam.angle + cam.fov / 2) * Math.PI) / 180;
            const x1 = cam.x + cam.range * Math.cos(startAngleRad);
            const y1 = cam.y + cam.range * Math.sin(startAngleRad);
            const x2 = cam.x + cam.range * Math.cos(endAngleRad);
            const y2 = cam.y + cam.range * Math.sin(endAngleRad);

            const wedgePath = `M ${cam.x} ${cam.y} L ${x1} ${y1} A ${cam.range} ${cam.range} 0 0 1 ${x2} ${y2} Z`;

            return (
              <g
                key={`cam-fov-${cam.id}`}
                style={{ cursor: isLab1 ? 'pointer' : 'default' }}
                onClick={() => {
                  if (isLab1 && onOpenPip) {
                    onOpenPip();
                  }
                }}
              >
                {/* Field-of-view Light Cone */}
                <path
                  d={wedgePath}
                  fill={liveActive ? 'url(#cam-cone-live)' : 'url(#cam-cone-fov)'}
                  stroke={liveActive ? '#ef4444' : '#0284c7'}
                  strokeWidth="0.8"
                  strokeDasharray="4,4"
                  opacity={liveActive ? 0.9 : 0.65}
                />

                {/* CCTV Camera Unit */}
                <g transform={`translate(${cam.x}, ${cam.y}) rotate(${cam.angle})`}>
                  {/* Camera Body */}
                  <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Lens */}
                  <polygon points="8,-4 14,-7 14,7 8,4" fill="#0284c7" />
                  {/* Wall Mounting Bracket */}
                  <line x1="-12" y1="0" x2="-8" y2="0" stroke="#1e293b" strokeWidth="3" />
                  <circle cx="0" cy="0" r="2.5" fill={liveActive ? '#ef4444' : '#10b981'} />
                </g>

                {/* Lab 1 LIVE Badge Callout */}
                {isLab1 && (
                  <g
                    transform={`translate(${cam.x + 18}, ${cam.y - 12})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPip && onOpenPip();
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="54"
                      height="20"
                      rx="4"
                      fill={liveActive ? '#dc2626' : '#059669'}
                      filter="url(#chip-shadow)"
                    />
                    <circle cx="9" cy="10" r="3.5" fill="#ffffff" className={liveActive ? 'twin-live-pulse' : ''} />
                    <text x="18" y="14" fill="#ffffff" fontSize="10" fontWeight="800" letterSpacing="0.04em">
                      {liveActive ? 'LIVE' : 'CAM 1'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* 9. DETECTED OCCUPANT DOTS LAYER */}
      {layers.people && (
        <g id="layer-people">
          {planRooms.map(r => {
            const runtime = getRoomRuntime(r.id);
            const count = runtime.people || 0;
            const isLab1 = r.id === 'room_1';

            // For Lab 1 with active camera vision or simulated detections: map real/simulated bounding boxes!
            if (isLab1 && lab1Detections && lab1Detections.length > 0) {
              return (
                <g key="lab1-real-people">
                  {lab1Detections.map((det, idx) => {
                    const normBbox = det.normBbox || [
                      (det.bbox?.[0] || 0) / (det.vw || 640),
                      (det.bbox?.[1] || 0) / (det.vh || 480),
                      (det.bbox?.[2] || 0) / (det.vw || 640),
                      (det.bbox?.[3] || 0) / (det.vh || 480)
                    ];
                    const [normX, normY, normW, normH] = normBbox;
                    const normCenterX = Math.max(0.08, Math.min(0.92, normX + normW / 2));
                    const normFootY = Math.max(0.12, Math.min(0.90, normY + normH));

                    // Map within Lab 1 floor boundaries: x: 30, y: 30, width: 290, height: 250
                    const mappedX = r.x + 30 + normCenterX * (r.width - 60);
                    const mappedY = r.y + 40 + normFootY * (r.height - 70);

                    return (
                      <g key={`person-det-${idx}`} transform={`translate(${mappedX}, ${mappedY})`}>
                        {/* Radar Pulse Ring */}
                        <circle cx="0" cy="0" r="14" fill="none" stroke="#06b6d4" strokeWidth="1.5" className="twin-radar-pulse" />
                        {/* Occupant Avatar Dot */}
                        <circle cx="0" cy="0" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" filter="url(#chip-shadow)" />
                        <text y="16" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="800">
                          Person {idx + 1}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            }

            // Fallback / simulated occupant dots for other rooms or generic room occupancy
            if (count > 0) {
              const dots = [];
              const basePos = isLab1 ? [
                { x: r.x + 80, y: r.y + 110 },
                { x: r.x + 150, y: r.y + 110 },
                { x: r.x + 80, y: r.y + 170 },
                { x: r.x + 150, y: r.y + 170 },
                { x: r.x + 210, y: r.y + 140 }
              ] : [
                { x: r.x + 70, y: r.y + 110 },
                { x: r.x + 130, y: r.y + 110 },
                { x: r.x + 70, y: r.y + 170 },
                { x: r.x + 130, y: r.y + 170 },
                { x: r.x + 200, y: r.y + 140 }
              ];

              for (let i = 0; i < Math.min(count, 5); i++) {
                const pos = basePos[i] || { x: r.x + 80 + i * 20, y: r.y + 120 };
                dots.push(
                  <g key={`sim-person-${r.id}-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle cx="0" cy="0" r="10" fill="none" stroke={isLab1 ? "#06b6d4" : "#10b981"} strokeWidth="1" opacity="0.6" className={isLab1 ? "twin-radar-pulse" : ""} />
                    <circle cx="0" cy="0" r="5.5" fill={isLab1 ? "#0284c7" : "#059669"} stroke="#ffffff" strokeWidth="1.8" filter="url(#chip-shadow)" />
                    {isLab1 && (
                      <text y="15" textAnchor="middle" fill="#0284c7" fontSize="8" fontWeight="800">
                        Person {i + 1}
                      </text>
                    )}
                  </g>
                );
              }
              return <g key={`people-sim-${r.id}`}>{dots}</g>;
            }

            return null;
          })}
        </g>
      )}

      {/* 10. EDIT MODE CROSSHAIR OVERLAY */}
      {editMode && (
        <g id="layer-edit-mode" style={{ pointerEvents: 'none' }}>
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill="none"
            stroke="#ec4899"
            strokeWidth="3"
            strokeDasharray="6,6"
          />
          <text
            x="500"
            y="25"
            textAnchor="middle"
            fill="#db2777"
            fontSize="12"
            fontWeight="800"
            letterSpacing="0.08em"
          >
            📐 CALIBRATION & TRACE MODE ACTIVE — CLICK ANYWHERE ON PLAN TO COPY COORDINATES (x%, y%)
          </text>
        </g>
      )}
    </svg>
  );
}
