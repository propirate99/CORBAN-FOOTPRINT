export interface FactorDto {
  id: string;
  name: string;
  value: number;
  unit: string;
  sourceName: string;
  geography: string;
  reportingPeriodOrStatus: string;
  emissionsBoundary: string;
  limitations: string;
  notice: string;
}

export interface CalculationResult {
  calculationId: string;
  activityType: 'ELECTRICITY' | 'EQUIPMENT' | 'TRAVEL';
  calculatedAt: string;
  inputDetails: Record<string, any>;
  quantities: Record<string, any>;
  estimatedKgCo2: number;
  allocatedKgCo2PerOccupant?: number | null;
  factorMetadata: FactorDto[];
  formula: string;
  assumptions: string[];
  notice: string;
}

export interface ElectricityFormValues {
  kwh: string;
}

export interface EquipmentFormValues {
  quantity: string;
  wattsPerUnit: string;
  hoursPerDay: string;
  days: string;
}

export interface TravelFormValues {
  fuelType: 'PETROL' | 'DIESEL';
  method: 'fuel' | 'distance';
  fuelLitres: string;
  distanceKm: string;
  mileageKmPerLitre: string;
  occupants: string;
}

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  details?: string[];
  timestamp?: string;
}
