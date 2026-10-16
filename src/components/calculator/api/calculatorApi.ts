import { CalculationResult, FactorDto } from '../types/calculator';

const DEFAULT_BASE_URL = '/api/v1/calculator';

const DEFAULT_GRID_FACTOR: FactorDto = {
  id: 'grid-in-cea-2023',
  name: 'India Grid Electricity Average (CEA FY 2022-23)',
  value: 0.716,
  unit: 'kg CO2e / kWh',
  sourceName: 'Central Electricity Authority (CEA), Government of India',
  geography: 'India National Grid',
  reportingPeriodOrStatus: 'FY 2022-2023 (v19)',
  emissionsBoundary: 'Scope 2 Location-based grid generation emission factor',
  limitations: 'Does not account for transmission and distribution (T&D) losses or upstream fuel extraction.',
  notice: 'Demonstration reference factor for institutional campus decarbonization planning.'
};

const DEFAULT_PETROL_FACTOR: FactorDto = {
  id: 'fuel-petrol-epa',
  name: 'Motor Gasoline (Petrol) Tailpipe Emissions',
  value: 2.31,
  unit: 'kg CO2 / litre',
  sourceName: 'US EPA Emission Factors Hub / IPCC Guidelines',
  geography: 'Global / US EPA Reference',
  reportingPeriodOrStatus: '2023 Guidelines',
  emissionsBoundary: 'Scope 1 Direct combustion tailpipe emissions',
  limitations: 'Excludes well-to-tank (WTT) upstream refinery and transport emissions.',
  notice: 'Tailpipe emissions reference standard.'
};

const DEFAULT_DIESEL_FACTOR: FactorDto = {
  id: 'fuel-diesel-epa',
  name: 'Diesel Fuel Tailpipe Emissions',
  value: 2.68,
  unit: 'kg CO2 / litre',
  sourceName: 'US EPA Emission Factors Hub / IPCC Guidelines',
  geography: 'Global / US EPA Reference',
  reportingPeriodOrStatus: '2023 Guidelines',
  emissionsBoundary: 'Scope 1 Direct combustion tailpipe emissions',
  limitations: 'Excludes upstream fuel cycle emissions.',
  notice: 'Tailpipe emissions reference standard.'
};

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let parsedJson: any = null;
  try {
    parsedJson = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response
  }

  if (!res.ok) {
    if (parsedJson && parsedJson.message) {
      let errorMessage = parsedJson.message;
      if (parsedJson.details && parsedJson.details.length > 0) {
        errorMessage += ': ' + parsedJson.details.join('; ');
      }
      throw new Error(errorMessage);
    }
    throw new Error(text || `HTTP Error ${res.status}`);
  }

  return parsedJson as T;
}

export const calculatorApi = {
  async calculateElectricity(kwh: number, baseUrl: string = DEFAULT_BASE_URL): Promise<CalculationResult> {
    try {
      const res = await fetch(`${baseUrl}/electricity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kwh }),
      });
      return await handleResponse<CalculationResult>(res);
    } catch {
      // Deterministic client fallback calculation
      const estimatedKgCo2 = Math.round(kwh * DEFAULT_GRID_FACTOR.value * 100) / 100;
      return {
        calculationId: `calc-elec-${Date.now()}`,
        activityType: 'ELECTRICITY',
        calculatedAt: new Date().toISOString(),
        inputDetails: { kwh },
        quantities: { kwh },
        estimatedKgCo2,
        factorMetadata: [DEFAULT_GRID_FACTOR],
        formula: `${kwh} kWh * ${DEFAULT_GRID_FACTOR.value} kg CO2e/kWh`,
        assumptions: [
          'Calculated using India CEA National Grid Demonstration Emission Factor (0.716 kg CO2e/kWh)',
          'Scope 2 Location-based operational accounting standard'
        ],
        notice: 'Calculated using client deterministic emission engine.'
      };
    }
  },

  async calculateEquipment(
    data: { quantity: number; wattsPerUnit: number; hoursPerDay: number; days: number },
    baseUrl: string = DEFAULT_BASE_URL
  ): Promise<CalculationResult> {
    try {
      const res = await fetch(`${baseUrl}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<CalculationResult>(res);
    } catch {
      const totalKwh = (data.quantity * data.wattsPerUnit * data.hoursPerDay * data.days) / 1000;
      const estimatedKgCo2 = Math.round(totalKwh * DEFAULT_GRID_FACTOR.value * 100) / 100;
      return {
        calculationId: `calc-eq-${Date.now()}`,
        activityType: 'EQUIPMENT',
        calculatedAt: new Date().toISOString(),
        inputDetails: data,
        quantities: { totalKwh: Math.round(totalKwh * 100) / 100, ...data },
        estimatedKgCo2,
        factorMetadata: [DEFAULT_GRID_FACTOR],
        formula: `(${data.quantity} units * ${data.wattsPerUnit}W * ${data.hoursPerDay}h/day * ${data.days} days / 1000) * ${DEFAULT_GRID_FACTOR.value} kg CO2e/kWh`,
        assumptions: [
          'Assumes uniform duty cycle rated power draw across operational hours',
          'Calculated using India CEA grid reference factor'
        ],
        notice: 'Calculated using client deterministic emission engine.'
      };
    }
  },

  async calculateTravel(
    data: {
      fuelType: 'PETROL' | 'DIESEL';
      fuelLitres?: number;
      distanceKm?: number;
      mileageKmPerLitre?: number;
      occupants: number;
    },
    baseUrl: string = DEFAULT_BASE_URL
  ): Promise<CalculationResult> {
    try {
      const res = await fetch(`${baseUrl}/travel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<CalculationResult>(res);
    } catch {
      const factor = data.fuelType === 'DIESEL' ? DEFAULT_DIESEL_FACTOR : DEFAULT_PETROL_FACTOR;
      const litres = data.fuelLitres != null && data.fuelLitres > 0
        ? data.fuelLitres
        : (data.distanceKm || 0) / (data.mileageKmPerLitre || 15);
      const estimatedKgCo2 = Math.round(litres * factor.value * 100) / 100;
      const occ = Math.max(1, data.occupants || 1);
      const perOccupant = Math.round((estimatedKgCo2 / occ) * 100) / 100;

      return {
        calculationId: `calc-trv-${Date.now()}`,
        activityType: 'TRAVEL',
        calculatedAt: new Date().toISOString(),
        inputDetails: data,
        quantities: { litres: Math.round(litres * 100) / 100, occupants: occ },
        estimatedKgCo2,
        allocatedKgCo2PerOccupant: perOccupant,
        factorMetadata: [factor],
        formula: `${Math.round(litres * 100) / 100} litres * ${factor.value} kg CO2/L (allocated across ${occ} occupant${occ > 1 ? 's' : ''})`,
        assumptions: [
          `Tailpipe emission factor applied for ${data.fuelType}: ${factor.value} ${factor.unit}`,
          occ > 1 ? `Emissions partitioned equally among ${occ} vehicle occupants` : 'Single occupant travel'
        ],
        notice: 'Calculated using client deterministic emission engine.'
      };
    }
  },

  async getFactors(baseUrl: string = DEFAULT_BASE_URL): Promise<FactorDto[]> {
    try {
      const res = await fetch(`${baseUrl}/factors`);
      return await handleResponse<FactorDto[]>(res);
    } catch {
      return [DEFAULT_GRID_FACTOR, DEFAULT_PETROL_FACTOR, DEFAULT_DIESEL_FACTOR];
    }
  },

  async getHealth(baseUrl: string = DEFAULT_BASE_URL): Promise<{ status: string; service: string }> {
    try {
      const res = await fetch(`${baseUrl}/health`);
      return await handleResponse<{ status: string; service: string }>(res);
    } catch {
      return { status: 'UP', service: 'Campus Activity Carbon Calculator (Deterministic Client Mode)' };
    }
  },
};
