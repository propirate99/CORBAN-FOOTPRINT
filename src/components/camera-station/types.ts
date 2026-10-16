// 3 Distinct State Categories (Prevent misleading dashboard behavior)

// 1. Camera Lifecycle State
export type CameraState =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPED'
  | 'ERROR';

// 2. Detection Engine State
export type DetectorState =
  | 'NOT_LOADED'
  | 'LOADING'
  | 'READY'
  | 'PROCESSING'
  | 'STALE'
  | 'ERROR';

// 3. Publishing Transport State
export type PublisherState =
  | 'UNCONNECTED'
  | 'IDLE'
  | 'SENDING'
  | 'CONNECTED'
  | 'ERROR';

// Room Observation States (Backend-driven)
export type RoomObservationState =
  | 'UNKNOWN'
  | 'OCCUPIED'
  | 'NO_PERSON_DETECTED'
  | 'VACANCY_CANDIDATE'
  | 'STALE';

// Bounding box for local overlay only
export interface DetectedBox {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

// In-browser inference result (never sent to network)
export interface DetectionResult {
  personCount: number;
  confidenceScore: number;
  boxes: DetectedBox[];
  inferenceTimestampMs: number;
  wallClockIso: string;
}

// Allowlisted aggregate payload sent to backend (counts and timestamps only)
export interface AggregateObservation {
  observationId: string;
  cameraSessionId: string;
  peopleDetected: number;
  observedAt: string;
  coverage: 'DEMO_AREA';
  source: 'BROWSER_CAMERA';
}

// Server acknowledgement
export interface ObservationAck {
  observationId: string;
  roomId: string;
  receivedAt: string;
}

// Camera Station Configuration
export interface CameraStationSettings {
  confidenceThreshold: number; // e.g., 0.5
  publishIntervalMs: number; // e.g., 2000, 5000, 10000
  facingMode: 'user' | 'environment';
  hidePreview: boolean;
}
