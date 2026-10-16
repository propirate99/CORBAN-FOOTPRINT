import { CalculationResult, FactorDto } from '../types/calculator';

const DEFAULT_BASE_URL = '/api/v1/calculator';

async function handleResponse<T>(res: Response): Promise<T> {
  // Read raw text once to avoid "body stream already read" TypeError
  const text = await res.text();
  let parsedJson: any = null;
  try {
    parsedJson = text ? JSON.parse(text) : null;
  } catch {
    // Response is not JSON (e.g., HTML gateway error from Vite proxy)
  }

  if (!res.ok) {
    // Vite proxy returns 500/502/504 when the target (127.0.0.1:8085) is not running
    if (res.status === 504 || res.status === 502 || (res.status === 500 && (!parsedJson || !parsedJson.status))) {
      throw new Error(
        `Backend service is not running on http://127.0.0.1:8085. Please start the backend with './mvnw.cmd spring-boot:run' inside isolated-carbon-calculator/backend.`
      );
    }
    if (parsedJson && parsedJson.message) {
      let errorMessage = parsedJson.message;
      if (parsedJson.details && parsedJson.details.length > 0) {
        errorMessage += ': ' + parsedJson.details.join('; ');
      }
      throw new Error(errorMessage);
    }
    throw new Error(text || `HTTP Error ${res.status} (${res.statusText})`);
  }

  return parsedJson as T;
}

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    throw new Error(
      `Network connection failed. Could not reach backend at ${url}. Please verify the Spring Boot backend is running on http://127.0.0.1:8085.`
    );
  }
}

export const calculatorApi = {
  async calculateElectricity(kwh: number, baseUrl: string = DEFAULT_BASE_URL): Promise<CalculationResult> {
    const res = await safeFetch(`${baseUrl}/electricity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kwh }),
    });
    return handleResponse<CalculationResult>(res);
  },

  async calculateEquipment(
    data: { quantity: number; wattsPerUnit: number; hoursPerDay: number; days: number },
    baseUrl: string = DEFAULT_BASE_URL
  ): Promise<CalculationResult> {
    const res = await safeFetch(`${baseUrl}/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<CalculationResult>(res);
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
    const res = await safeFetch(`${baseUrl}/travel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<CalculationResult>(res);
  },

  async getFactors(baseUrl: string = DEFAULT_BASE_URL): Promise<FactorDto[]> {
    const res = await safeFetch(`${baseUrl}/factors`);
    return handleResponse<FactorDto[]>(res);
  },

  async getHealth(baseUrl: string = DEFAULT_BASE_URL): Promise<{ status: string; service: string }> {
    const res = await safeFetch(`${baseUrl}/health`);
    return handleResponse<{ status: string; service: string }>(res);
  },
};
