// Architectural 2D Floor Plan Configuration
// Top-down MagicPlan / Floorplanner style CAD data
// ViewBox coordinate system: 0 0 1000 640

export const PLAN_CONFIG = {
  width: 1000,
  height: 640,
  scale: '1m = 30px',
  backgroundImage: '/plan.png', // Optional override if user places /public/plan.png

  // Central corridor bounds
  corridor: {
    name: 'Main Corridor & Circulation',
    area: 34.5,
    polygon: [
      { x: 30, y: 280 },
      { x: 970, y: 280 },
      { x: 970, y: 350 },
      { x: 30, y: 350 }
    ],
    floorType: 'tile'
  },

  // 6 Campus Rooms defined as architectural polygons
  rooms: [
    {
      id: 'room_1',
      name: 'Lab 1 (Live CCTV)',
      shortName: 'Lab 1',
      code: 'A-201',
      area: 48.5, // m²
      floorType: 'concrete',
      x: 30,
      y: 30,
      width: 290,
      height: 250,
      polygon: [
        { x: 30, y: 30 },
        { x: 320, y: 30 },
        { x: 320, y: 280 },
        { x: 30, y: 280 }
      ],
      pctBounds: { left: 3, top: 4.7, width: 29, height: 39 },
      labelPos: { x: 175, y: 155 },
      chipPos: { x: 175, y: 80 },
      doors: [
        { x: 230, y: 280, width: 36, angle: 90, swing: 'in-right' }
      ],
      windows: [
        { x: 60, y: 30, length: 70, orientation: 'horizontal' },
        { x: 180, y: 30, length: 70, orientation: 'horizontal' }
      ],
      furniture: [
        { type: 'desk_pc', x: 65, y: 70, rotation: 0 },
        { type: 'desk_pc', x: 125, y: 70, rotation: 0 },
        { type: 'desk_pc', x: 65, y: 200, rotation: 180 },
        { type: 'desk_pc', x: 125, y: 200, rotation: 180 },
        { type: 'lab_bench', x: 250, y: 80, rotation: 90 },
        { type: 'server_rack', x: 290, y: 220, rotation: 0 },
        { type: 'plant', x: 50, y: 260, scale: 0.8 }
      ],
      camera: {
        id: 'cam_1',
        name: 'CAM-01 (Lab 1 Wide-Angle)',
        x: 45,
        y: 45,
        angle: 45, // degrees
        fov: 75,
        range: 220,
        isLive: true
      }
    },
    {
      id: 'room_2',
      name: 'Lab 2 (Advanced AI)',
      shortName: 'Lab 2',
      code: 'A-202',
      area: 44.0, // m²
      floorType: 'tile',
      x: 340,
      y: 30,
      width: 290,
      height: 250,
      polygon: [
        { x: 340, y: 30 },
        { x: 630, y: 30 },
        { x: 630, y: 280 },
        { x: 340, y: 280 }
      ],
      pctBounds: { left: 34, top: 4.7, width: 29, height: 39 },
      labelPos: { x: 485, y: 155 },
      chipPos: { x: 485, y: 80 },
      doors: [
        { x: 380, y: 280, width: 36, angle: 90, swing: 'in-left' }
      ],
      windows: [
        { x: 390, y: 30, length: 75, orientation: 'horizontal' },
        { x: 505, y: 30, length: 75, orientation: 'horizontal' }
      ],
      furniture: [
        { type: 'desk_pc', x: 380, y: 70, rotation: 0 },
        { type: 'desk_pc', x: 440, y: 70, rotation: 0 },
        { type: 'desk_pc', x: 500, y: 70, rotation: 0 },
        { type: 'desk_pc', x: 380, y: 200, rotation: 180 },
        { type: 'desk_pc', x: 440, y: 200, rotation: 180 },
        { type: 'desk_pc', x: 500, y: 200, rotation: 180 },
        { type: 'instructor_desk', x: 590, y: 140, rotation: 270 }
      ],
      camera: {
        id: 'cam_2',
        name: 'CAM-02 (Lab 2 Ceiling)',
        x: 615,
        y: 45,
        angle: 135,
        fov: 70,
        range: 200,
        isLive: false
      }
    },
    {
      id: 'room_3',
      name: 'Library & Silent Study',
      shortName: 'Library',
      code: 'A-203',
      area: 58.0, // m²
      floorType: 'carpet',
      x: 650,
      y: 30,
      width: 320,
      height: 250,
      polygon: [
        { x: 650, y: 30 },
        { x: 970, y: 30 },
        { x: 970, y: 280 },
        { x: 650, y: 280 }
      ],
      pctBounds: { left: 65, top: 4.7, width: 32, height: 39 },
      labelPos: { x: 810, y: 155 },
      chipPos: { x: 810, y: 80 },
      doors: [
        { x: 690, y: 280, width: 36, angle: 90, swing: 'in-left' }
      ],
      windows: [
        { x: 720, y: 30, length: 80, orientation: 'horizontal' },
        { x: 850, y: 30, length: 80, orientation: 'horizontal' },
        { x: 970, y: 90, length: 80, orientation: 'vertical' }
      ],
      furniture: [
        { type: 'bookshelf_double', x: 710, y: 75, rotation: 0 },
        { type: 'bookshelf_double', x: 790, y: 75, rotation: 0 },
        { type: 'bookshelf_double', x: 870, y: 75, rotation: 0 },
        { type: 'reading_table', x: 730, y: 200, rotation: 0 },
        { type: 'reading_table', x: 850, y: 200, rotation: 0 },
        { type: 'plant', x: 945, y: 55, scale: 0.9 },
        { type: 'armchair', x: 940, y: 220, rotation: 315 }
      ],
      camera: {
        id: 'cam_3',
        name: 'CAM-03 (Library Atrium)',
        x: 955,
        y: 45,
        angle: 215,
        fov: 65,
        range: 220,
        isLive: false
      }
    },
    {
      id: 'room_4',
      name: 'Seminar Hall (Auditorium)',
      shortName: 'Seminar Hall',
      code: 'A-204',
      area: 72.0, // m²
      floorType: 'parquet',
      x: 30,
      y: 350,
      width: 290,
      height: 260,
      polygon: [
        { x: 30, y: 350 },
        { x: 320, y: 350 },
        { x: 320, y: 610 },
        { x: 30, y: 610 }
      ],
      pctBounds: { left: 3, top: 54.7, width: 29, height: 40.6 },
      labelPos: { x: 175, y: 475 },
      chipPos: { x: 175, y: 405 },
      doors: [
        { x: 250, y: 350, width: 40, angle: 270, swing: 'in-right' }
      ],
      windows: [
        { x: 60, y: 610, length: 70, orientation: 'horizontal' },
        { x: 180, y: 610, length: 70, orientation: 'horizontal' }
      ],
      furniture: [
        { type: 'stage_podium', x: 175, y: 390, rotation: 0 },
        { type: 'seats_row', x: 70, y: 450, count: 5 },
        { type: 'seats_row', x: 70, y: 500, count: 5 },
        { type: 'seats_row', x: 70, y: 550, count: 5 },
        { type: 'plant', x: 50, y: 375, scale: 0.8 },
        { type: 'plant', x: 300, y: 375, scale: 0.8 }
      ],
      camera: {
        id: 'cam_4',
        name: 'CAM-04 (Seminar Overview)',
        x: 45,
        y: 595,
        angle: 315,
        fov: 75,
        range: 230,
        isLive: false
      }
    },
    {
      id: 'room_5',
      name: 'Staff Room & Faculty Lounge',
      shortName: 'Staff Room',
      code: 'A-205',
      area: 36.5, // m²
      floorType: 'parquet',
      x: 340,
      y: 350,
      width: 290,
      height: 260,
      polygon: [
        { x: 340, y: 350 },
        { x: 630, y: 350 },
        { x: 630, y: 610 },
        { x: 340, y: 610 }
      ],
      pctBounds: { left: 34, top: 54.7, width: 29, height: 40.6 },
      labelPos: { x: 485, y: 475 },
      chipPos: { x: 485, y: 405 },
      doors: [
        { x: 380, y: 350, width: 36, angle: 270, swing: 'in-left' }
      ],
      windows: [
        { x: 420, y: 610, length: 110, orientation: 'horizontal' }
      ],
      furniture: [
        { type: 'meeting_table_oval', x: 485, y: 480, rotation: 0 },
        { type: 'sofa_3seat', x: 365, y: 480, rotation: 90 },
        { type: 'credenza', x: 485, y: 595, rotation: 0 },
        { type: 'coffee_station', x: 605, y: 585, rotation: 0 },
        { type: 'plant', x: 605, y: 375, scale: 0.85 }
      ],
      camera: {
        id: 'cam_5',
        name: 'CAM-05 (Staff Lounge)',
        x: 615,
        y: 365,
        angle: 225,
        fov: 65,
        range: 190,
        isLive: false
      }
    },
    {
      id: 'room_6',
      name: 'Campus Canteen & Cafeteria',
      shortName: 'Canteen',
      code: 'A-206',
      area: 56.5, // m²
      floorType: 'tile_checkered',
      x: 650,
      y: 350,
      width: 320,
      height: 260,
      polygon: [
        { x: 650, y: 350 },
        { x: 970, y: 350 },
        { x: 970, y: 610 },
        { x: 650, y: 610 }
      ],
      pctBounds: { left: 65, top: 54.7, width: 32, height: 40.6 },
      labelPos: { x: 810, y: 475 },
      chipPos: { x: 810, y: 405 },
      doors: [
        { x: 690, y: 350, width: 44, angle: 270, swing: 'double' }
      ],
      windows: [
        { x: 740, y: 610, length: 90, orientation: 'horizontal' },
        { x: 870, y: 610, length: 70, orientation: 'horizontal' },
        { x: 970, y: 430, length: 80, orientation: 'vertical' }
      ],
      furniture: [
        { type: 'dining_table_4', x: 720, y: 440, rotation: 0 },
        { type: 'dining_table_4', x: 820, y: 440, rotation: 0 },
        { type: 'dining_table_4', x: 720, y: 540, rotation: 0 },
        { type: 'dining_table_4', x: 820, y: 540, rotation: 0 },
        { type: 'serving_counter', x: 925, y: 510, rotation: 90 },
        { type: 'vending_machine', x: 940, y: 375, rotation: 0 }
      ],
      camera: {
        id: 'cam_6',
        name: 'CAM-06 (Cafeteria Zone)',
        x: 955,
        y: 595,
        angle: 315,
        fov: 70,
        range: 220,
        isLive: false
      }
    }
  ]
};
