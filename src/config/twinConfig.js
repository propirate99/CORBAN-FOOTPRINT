// Campus Energy Digital Twin Configuration & Constants
// Single source of truth for energy formulas, tariff rates, simulation speed, and room models

export const TWIN_CONFIG = {
  // Grid carbon emission factor: 0.71 kg CO2 per kWh
  EMISSION_FACTOR: 0.71,

  // Electricity tariff: ₹8 per kWh
  TARIFF: 8,

  // Demo simulation speed multiplier: 1 second = 60 seconds (1 minute)
  SIM_SPEED: 60,

  // Power ratings in kW
  STANDBY_KW: 0.12,
  AC_KW: 1.8,
  LIGHTS_KW: 0.4,

  // Detection and leak timing
  DEFAULT_LEAK_SECONDS: 20, // Default for demo (production would use 15 min / 900s)
  MIN_LEAK_SECONDS: 5,
  MAX_LEAK_SECONDS: 60,
  DEFAULT_LIGHT_THRESHOLD: 70, // 0-255 average luminance cutoff for "lights on"
  VISION_DETECTION_INTERVAL_MS: 700, // Vision inference tick in ms (~700ms)
  METER_ENGINE_INTERVAL_MS: 1000, // Meter simulation tick (1000ms = 1s = 1 min demo time)

  // Default projection what-if hours
  DEFAULT_IDLE_HOURS: 6,

  // Initial room telemetry layout (matches standard 6-room campus block floor plan)
  INITIAL_ROOMS: [
    { id: 'room_1', name: 'Lab 1 (live)', x: 20, y: 20, people: 2, ac: true, lights: true, forget: false, idle: 0, status: 'ok', kw: 2.32, wasteKwh: 0, isLive: true },
    { id: 'room_2', name: 'Lab 2', x: 210, y: 20, people: 2, ac: true, lights: true, forget: false, idle: 0, status: 'ok', kw: 2.32, wasteKwh: 0, isLive: false },
    { id: 'room_3', name: 'Library', x: 400, y: 20, people: 3, ac: true, lights: true, forget: false, idle: 0, status: 'ok', kw: 2.32, wasteKwh: 0, isLive: false },
    { id: 'room_4', name: 'Seminar hall', x: 20, y: 200, people: 0, ac: false, lights: false, forget: false, idle: 0, status: 'ok', kw: 0.12, wasteKwh: 0, isLive: false },
    { id: 'room_5', name: 'Staff room', x: 210, y: 200, people: 1, ac: true, lights: true, forget: false, idle: 0, status: 'ok', kw: 2.32, wasteKwh: 0, isLive: false },
    { id: 'room_6', name: 'Canteen', x: 400, y: 200, people: 4, ac: true, lights: true, forget: false, idle: 0, status: 'ok', kw: 2.32, wasteKwh: 0, isLive: false }
  ],

  // Status mapping
  STATUS_LABELS: {
    ok: 'Normal',
    warn: 'Empty, load still on',
    leak: 'Energy leak'
  }
};

/**
 * Calculates current active power draw (kW) for a given room state.
 * Formula: kW = 0.12 standby + 1.8 if AC on + 0.4 if lights on
 */
export function calculateRoomPower(room) {
  return (
    TWIN_CONFIG.STANDBY_KW +
    (room.ac ? TWIN_CONFIG.AC_KW : 0) +
    (room.lights ? TWIN_CONFIG.LIGHTS_KW : 0)
  );
}

/**
 * Calculates idle waste power draw (kW) for a room that has active load while unoccupied.
 */
export function calculateIdleWastePower(room) {
  if (room.idle > 0) {
    return Math.max(0, calculateRoomPower(room) - TWIN_CONFIG.STANDBY_KW);
  }
  return 0;
}
