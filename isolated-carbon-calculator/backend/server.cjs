const http = require('http');

const PORT = 8085;
const HOST = '127.0.0.1';

const LITRES_PER_GALLON = 3.785411784;

const FACTORS = {
  CEA_V19_FY2022_23_DEMO: {
    id: 'CEA_V19_FY2022_23_DEMO',
    name: 'India Grid Electricity Emission Factor',
    value: 0.716,
    unit: 'kg CO2/kWh',
    sourceName: 'CEA CO2 Baseline Database, Version 19.0',
    geography: 'India',
    reportingPeriodOrStatus: 'FY 2022-23 (Historical demonstration factor)',
    emissionsBoundary: 'Grid generation operational direct CO2 only',
    limitations: 'Historical demonstration factor; not an audited reporting recommendation or real-time marginal factor.',
    notice: 'Historical demonstration factor; not an audited reporting recommendation.'
  },
  EPA_GASOLINE_TAILPIPE_REFERENCE: {
    id: 'EPA_GASOLINE_TAILPIPE_REFERENCE',
    name: 'Motor Gasoline (Petrol) Reference Factor',
    value: 8.887 / LITRES_PER_GALLON,
    unit: 'kg CO2/litre',
    sourceName: 'US EPA GHG Emission Factors Hub (8.887 kg CO2 / US gallon)',
    geography: 'United States reference',
    reportingPeriodOrStatus: 'Reference standard',
    emissionsBoundary: 'Tailpipe CO2 only',
    limitations: 'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.',
    notice: 'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.'
  },
  EPA_DIESEL_TAILPIPE_REFERENCE: {
    id: 'EPA_DIESEL_TAILPIPE_REFERENCE',
    name: 'Diesel Fuel Reference Factor',
    value: 10.180 / LITRES_PER_GALLON,
    unit: 'kg CO2/litre',
    sourceName: 'US EPA GHG Emission Factors Hub (10.180 kg CO2 / US gallon)',
    geography: 'United States reference',
    reportingPeriodOrStatus: 'Reference standard',
    emissionsBoundary: 'Tailpipe CO2 only',
    limitations: 'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.',
    notice: 'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.'
  }
};

const NOTICE = 'Estimated CO2 from the activities entered.';

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message, details = []) {
  sendJson(res, statusCode, {
    status: statusCode,
    error: statusCode === 400 ? 'Bad Request' : 'Internal Server Error',
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = url.pathname;

  if (pathname === '/api/v1/calculator/health' && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'UP',
      service: 'isolated-carbon-calculator',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === '/api/v1/calculator/factors' && req.method === 'GET') {
    sendJson(res, 200, Object.values(FACTORS));
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try {
        data = body ? JSON.parse(body) : {};
      } catch (e) {
        sendError(res, 400, 'Malformed JSON body', ['JSON parse error']);
        return;
      }

      if (pathname === '/api/v1/calculator/electricity') {
        const kwh = Number(data.kwh);
        if (data.kwh === undefined || data.kwh === null || isNaN(kwh)) {
          sendError(res, 400, 'kwh is required and must be a number');
          return;
        }
        if (kwh < 0) {
          sendError(res, 400, 'kwh cannot be negative');
          return;
        }

        const factor = FACTORS.CEA_V19_FY2022_23_DEMO;
        const estimatedKgCo2 = kwh * factor.value;

        sendJson(res, 200, {
          calculationId: 'calc-' + Math.random().toString(36).substring(2, 9),
          activityType: 'ELECTRICITY',
          calculatedAt: new Date().toISOString(),
          inputDetails: { kwh },
          quantities: { kwh, kwhUnit: 'kWh', estimatedKgCo2, co2Unit: 'kg CO2' },
          estimatedKgCo2,
          allocatedKgCo2PerOccupant: null,
          factorMetadata: [factor],
          formula: `estimatedKgCo2 = kwh * electricityFactor (${factor.value.toFixed(4)} kg CO2/kWh)`,
          assumptions: [
            'Grid emission factor based on CEA CO2 Baseline Database v19.0 (FY 2022-23) for India.',
            'Historical demonstration factor; not an audited reporting recommendation.',
            'Accounts for generation operational direct CO2 emissions only; does not claim full lifecycle CO2e.'
          ],
          notice: NOTICE
        });
        return;
      }

      if (pathname === '/api/v1/calculator/equipment') {
        const { quantity, wattsPerUnit, hoursPerDay, days } = data;
        const q = Number(quantity);
        const w = Number(wattsPerUnit);
        const h = Number(hoursPerDay);
        const d = Number(days);

        if (!Number.isInteger(q) || q < 1) {
          sendError(res, 400, 'quantity must be a positive integer (at least 1)');
          return;
        }
        if (isNaN(w) || w < 0) {
          sendError(res, 400, 'wattsPerUnit cannot be negative');
          return;
        }
        if (isNaN(h) || h < 0 || h > 24) {
          sendError(res, 400, 'hoursPerDay must be between 0 and 24');
          return;
        }
        if (!Number.isInteger(d) || d < 1 || d > 366) {
          sendError(res, 400, 'days must be an integer between 1 and 366');
          return;
        }

        const estimatedKwh = (q * w * h * d) / 1000.0;
        const factor = FACTORS.CEA_V19_FY2022_23_DEMO;
        const estimatedKgCo2 = estimatedKwh * factor.value;

        sendJson(res, 200, {
          calculationId: 'calc-' + Math.random().toString(36).substring(2, 9),
          activityType: 'EQUIPMENT',
          calculatedAt: new Date().toISOString(),
          inputDetails: { quantity: q, wattsPerUnit: w, hoursPerDay: h, days: d },
          quantities: { estimatedKwh, kwhUnit: 'kWh', estimatedKgCo2, co2Unit: 'kg CO2' },
          estimatedKgCo2,
          allocatedKgCo2PerOccupant: null,
          factorMetadata: [factor],
          formula: `estimatedKwh = (quantity * wattsPerUnit * hoursPerDay * days) / 1000; estimatedKgCo2 = estimatedKwh * ${factor.value.toFixed(4)} kg CO2/kWh`,
          assumptions: [
            'Assumes constant power draw at the entered rated wattage throughout operating duration.',
            'Rated power is an equipment nameplate rating, not a sub-metered power measurement.',
            'Variable-power loads require a dynamic load profile model.',
            'No automatic equipment control is executed; no safety claims are inferred.',
            'Do not add this estimate to electricity bills that already account for this equipment power.'
          ],
          notice: NOTICE
        });
        return;
      }

      if (pathname === '/api/v1/calculator/travel') {
        const { fuelType, fuelLitres, distanceKm, mileageKmPerLitre, occupants } = data;

        if (!fuelType || !['PETROL', 'DIESEL'].includes(fuelType.toUpperCase())) {
          sendError(res, 400, 'fuelType must be PETROL or DIESEL');
          return;
        }

        const occ = Number(occupants);
        if (!Number.isInteger(occ) || occ < 1 || occ > 100) {
          sendError(res, 400, 'occupants must be an integer from 1 to 100');
          return;
        }

        const hasFuel = fuelLitres !== undefined && fuelLitres !== null;
        const hasDist = distanceKm !== undefined && distanceKm !== null;
        const hasMileage = mileageKmPerLitre !== undefined && mileageKmPerLitre !== null;

        if (hasFuel && (hasDist || hasMileage)) {
          sendError(res, 400, 'Conflicting travel methods. Provide fuelLitres OR (distanceKm and mileageKmPerLitre), not both.');
          return;
        }
        if (!hasFuel && !hasDist && !hasMileage) {
          sendError(res, 400, 'Missing travel method. Provide fuelLitres OR (distanceKm and mileageKmPerLitre).');
          return;
        }

        const factorKey = fuelType.toUpperCase() === 'PETROL' ? 'EPA_GASOLINE_TAILPIPE_REFERENCE' : 'EPA_DIESEL_TAILPIPE_REFERENCE';
        const factor = FACTORS[factorKey];

        let litres = 0;
        let method = '';
        let formula = '';

        if (hasFuel) {
          litres = Number(fuelLitres);
          if (isNaN(litres) || litres < 0) {
            sendError(res, 400, 'fuelLitres cannot be negative');
            return;
          }
          method = 'FUEL_LITRES';
          formula = `totalKgCo2 = fuelLitres (${litres.toFixed(3)} L) * fuelFactor (${factor.value.toFixed(5)} kg CO2/L)`;
        } else {
          if (!hasDist || !hasMileage) {
            sendError(res, 400, 'Both distanceKm and mileageKmPerLitre are required for distance calculation.');
            return;
          }
          const dist = Number(distanceKm);
          const mileage = Number(mileageKmPerLitre);
          if (isNaN(dist) || dist < 0) {
            sendError(res, 400, 'distanceKm cannot be negative');
            return;
          }
          if (isNaN(mileage) || mileage <= 0) {
            sendError(res, 400, 'mileageKmPerLitre must be strictly greater than zero');
            return;
          }
          litres = dist / mileage;
          method = 'DISTANCE_AND_MILEAGE';
          formula = `estimatedFuelLitres = distanceKm (${dist.toFixed(2)} km) / mileage (${mileage.toFixed(2)} km/L) = ${litres.toFixed(4)} L; totalKgCo2 = estimatedFuelLitres * fuelFactor (${factor.value.toFixed(5)} kg CO2/L)`;
        }

        const totalKgCo2 = litres * factor.value;
        const allocatedKgCo2PerOccupant = totalKgCo2 / occ;

        sendJson(res, 200, {
          calculationId: 'calc-' + Math.random().toString(36).substring(2, 9),
          activityType: 'TRAVEL',
          calculatedAt: new Date().toISOString(),
          inputDetails: { fuelType: fuelType.toUpperCase(), calculationMethod: method, occupants: occ },
          quantities: { fuelLitres: litres, fuelUnit: 'Litres', totalTripKgCo2: totalKgCo2, allocatedKgCo2PerOccupant, co2Unit: 'kg CO2' },
          estimatedKgCo2: totalKgCo2,
          allocatedKgCo2PerOccupant,
          factorMetadata: [factor],
          formula,
          assumptions: [
            'US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.',
            'Boundary: Tailpipe direct CO2 only. Excludes CH4, N2O, and vehicle manufacturing lifecycle impacts.',
            'Allocation divides trip emissions equally among occupants for personal footprint accounting; it does NOT physically reduce vehicle tailpipe emissions.',
            'Do not sum allocated individual shares back into the trip total.'
          ],
          notice: NOTICE
        });
        return;
      }

      sendError(res, 404, 'Endpoint not found');
    });
    return;
  }

  sendError(res, 404, 'Endpoint not found');
});

server.listen(PORT, HOST, () => {
  console.log(`Isolated Carbon Calculator backend listening on http://${HOST}:${PORT}`);
});
