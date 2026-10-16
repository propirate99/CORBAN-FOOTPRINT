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

export interface GeneratedExplanation {
  summary: string;
  reason: string;
  assumptions: string[];
  suggestedChecks: string[];
}

export interface ExplanationMetrics {
  estimatedAvoidedKwh: number;
  estimatedAvoidedKgCo2: number;
}

export interface FactorMetadata {
  factorSource: string;
  reportingYear: number;
  factorValue: number;
  factorUnit: string;
}

export type ExplanationSource = 'GENAI' | 'TEMPLATE';

export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE_OCCUPIED' | 'INELIGIBLE_STALE';

export interface ExplanationResponse {
  scenarioId: string;
  roomId: string;
  source: ExplanationSource;
  fallbackReason: string | null;
  generatedAt: string;
  currentEligibility: EligibilityStatus;
  evidenceLevel: string;
  metrics: ExplanationMetrics;
  factorMetadata: FactorMetadata;
  explanation: GeneratedExplanation;
  mandatorySafetyChecks: string[];
  limitations: string[];
  actionPermission: string;
}

export interface SavedScenario {
  id: string;
  roomId: string;
  scenarioType: string;
  title: string;
  description: string;
  observationDescription: string;
  selectedEquipmentType: string;
  equipmentStateBasis: string;
  scenarioDurationMinutes: number;
  estimatedAvoidedKwh: number;
  estimatedAvoidedKgCo2: number;
  factorSource: string;
  factorReportingYear: number;
  factorValue: number;
  factorUnit: string;
  evidenceLevel: string;
  createdAt: string;
  assumptions: string[];
  forbiddenActions: string[];
}

export interface ScenarioComparisonResponse {
  scenarioA: {
    id: string;
    title: string;
    avoidedKwh: number;
    avoidedKgCo2: number;
  };
  scenarioB: {
    id: string;
    title: string;
    avoidedKwh: number;
    avoidedKgCo2: number;
  };
  comparisonExplanation: {
    summary: string;
    reason: string;
    tradeOffs: string[];
  };
  source: string;
  actionPermission: string;
}
