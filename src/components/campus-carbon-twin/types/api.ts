export type RoomStatus = 'OPTIMAL' | 'IN_USE' | 'WASTEFUL' | 'OFFLINE';

export type EquipmentType = 'HVAC' | 'LIGHTING' | 'COMPUTING' | 'PROJECTOR';

export interface Equipment {
  id: string;
  name: string;
  roomId: string;
  type: EquipmentType;
  isActive: boolean;
  wattageWatts: number;
}

export type ObservationState = 'UNKNOWN' | 'OCCUPIED' | 'NO_PERSON_DETECTED' | 'VACANCY_CANDIDATE' | 'STALE';

export interface Room {
  id: string;
  name: string;
  buildingId: string;
  capacity: number;
  currentOccupancy: number;
  status: RoomStatus;
  powerDrawKw: number;
  emissionRateKgCo2ePerHour: number;
  equipment?: Equipment[];
  lastObservationTimestamp?: string;
  confidenceScore?: number;
  observationState?: ObservationState;
  lastReceivedAt?: string;
  source?: string;
  coverage?: string;
  equipmentState?: string;
}


export interface Building {
  id: string;
  name: string;
  floors: number;
  rooms: Room[];
}

export interface CampusSummary {
  id: string;
  name: string;
  totalBuildings: number;
  currentPowerKw: number;
  currentHourlyEmissionsKg: number;
  activeWasteAlerts: number;
  gridCarbonIntensityKgPerKwh: number;
}

export interface ObservationInput {
  roomId: string;
  personCount: number;
  confidenceScore: number;
  deviceId?: string;
  timestamp?: string;
}

export interface ObservationReceipt {
  id: string;
  roomId: string;
  personCount: number;
  confidenceScore: number;
  wasteDetected: boolean;
  loggedAt: string;
}

export interface ScenarioInput {
  hvacTempDeltaCelsius: number;
  autoShutoffEmptyRooms: boolean;
  solarCapacityKw: number;
}

export interface ScenarioResult {
  scenarioName: string;
  baselineMonthlyCo2eKg: number;
  projectedMonthlyCo2eKg: number;
  netReductionPercentage: number;
  annualCostSavingsUsd: number;
}

export interface ActionItem {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  description: string;
  explanation: string;
  estimatedHourlyCo2eSavedKg: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'DISMISSED';
  createdAt: string;
}
