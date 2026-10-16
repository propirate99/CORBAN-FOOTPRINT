/**
 * Carbon Twin - Standardized Carbon Accounting & Personal Calculator Engine
 * Conforms to ISO 14064-1 & GHG Protocol accounting principles.
 * Zero-PII Guarantee: strictly stateless, no personal identifiers recorded.
 */

const EMISSION_FACTORS = {
  grid: [
    {
      id: 'CEA_V19_FY2022_23_DEMO',
      name: 'Central Electricity Authority (CEA) India Baseline v19',
      value: 0.716,
      unit: 'kg CO2 / kWh',
      geography: 'India National Grid',
      source: 'CEA CO2 Baseline Database for Indian Power Sector v19'
    },
    {
      id: 'US_EPA_EGRID_2024',
      name: 'US EPA eGRID National Average',
      value: 0.370,
      unit: 'kg CO2 / kWh',
      geography: 'United States',
      source: 'US EPA eGRID 2024 GHG Factors Hub'
    },
    {
      id: 'RENEWABLE_GREEN_TARIFF',
      name: 'Certified Green Power / Solar Microgrid PPA',
      value: 0.045,
      unit: 'kg CO2 / kWh',
      geography: 'Campus Rooftop Solar & Renewable PPA',
      source: 'On-site PV Generation Lifecycle Assessment'
    },
    {
      id: 'HIGH_CARBON_PEAKER',
      name: 'Thermal Coal Peaker Plant Grid Mix',
      value: 0.885,
      unit: 'kg CO2 / kWh',
      geography: 'Regional Coal Sub-grid',
      source: 'Regional Dispatch Telemetry'
    }
  ],
  transport: {
    PETROL_CAR: {
      name: 'Gasoline / Petrol Car',
      factor_per_km: 0.172,
      fuel_factor: 2.348, // kg CO2 / litre (US EPA Hub)
      avg_efficiency_km_per_l: 13.6,
      unit: 'kg CO2 / km',
      disclaimer: 'Tailpipe CO2 only; excludes upstream fuel refining lifecycle.'
    },
    DIESEL_CAR: {
      name: 'Diesel Passenger Car',
      factor_per_km: 0.154,
      fuel_factor: 2.689, // kg CO2 / litre (US EPA Hub)
      avg_efficiency_km_per_l: 17.5,
      unit: 'kg CO2 / km',
      disclaimer: 'Tailpipe CO2 only; excludes upstream fuel refining lifecycle.'
    },
    ELECTRIC_VEHICLE: {
      name: 'Battery Electric Vehicle (BEV)',
      factor_per_km: 0.052,
      avg_efficiency_kwh_per_km: 0.15,
      unit: 'kg CO2 / km',
      disclaimer: 'Calculated using average campus grid generation factor.'
    },
    CAMPUS_SHUTTLE_BUS: {
      name: 'Campus Transit Shuttle (Bio-CNG / Diesel)',
      factor_per_km: 0.082,
      unit: 'kg CO2 / passenger-km',
      disclaimer: 'Per passenger based on 25-passenger average occupancy.'
    },
    COMMUTER_RAIL: {
      name: 'Suburban Commuter Rail / Metro',
      factor_per_km: 0.038,
      unit: 'kg CO2 / passenger-km',
      disclaimer: 'Electric traction grid emissions per passenger-km.'
    },
    MOTORCYCLE: {
      name: 'Motorcycle / Scooter (150cc)',
      factor_per_km: 0.071,
      avg_efficiency_km_per_l: 35.0,
      unit: 'kg CO2 / km',
      disclaimer: 'Direct combustion exhaust emissions.'
    },
    BICYCLE_WALK: {
      name: 'Active Commute (Bicycle / Walking)',
      factor_per_km: 0.000,
      unit: 'kg CO2 / km',
      disclaimer: 'Zero direct tailpipe emissions.'
    }
  },
  equipment_presets: [
    { name: 'Ultra-Low Temp Cryo-Freezer (-80°C)', watts: 1250, default_qty: 2, nonessential: false },
    { name: 'High-Performance GPU Compute Node (Dual 4K + Rig)', watts: 380, default_qty: 20, nonessential: true },
    { name: 'Industrial Robotic Arm Rig', watts: 750, default_qty: 4, nonessential: true },
    { name: 'Laser Projection & Par-Can Array', watts: 1400, default_qty: 2, nonessential: true },
    { name: 'Overhead High-Lumen LED Bay Matrix', watts: 120, default_qty: 12, nonessential: true },
    { name: 'Emergency Fume Hood Exhaust (Continuous)', watts: 1100, default_qty: 2, nonessential: false },
    { name: 'Standard Academic Desktop Station', watts: 180, default_qty: 30, nonessential: true },
    { name: 'Classroom Air Conditioning Unit (Split)', watts: 1800, default_qty: 2, nonessential: true }
  ]
};

class CarbonCalculatorService {
  getFactors() {
    return EMISSION_FACTORS;
  }

  calculateElectricity({
    kwh,
    bill_amount,
    tariff_rate = 8.50,
    factor_id = 'CEA_V19_FY2022_23_DEMO',
    period = 'MONTHLY'
  }) {
    let computedKwh = Number(kwh);
    if ((computedKwh === undefined || isNaN(computedKwh) || computedKwh <= 0) && bill_amount && Number(bill_amount) > 0) {
      computedKwh = Number(bill_amount) / (Number(tariff_rate) || 8.50);
    }
    computedKwh = Math.max(0, computedKwh || 0);

    const factorObj = EMISSION_FACTORS.grid.find(f => f.id === factor_id) || EMISSION_FACTORS.grid[0];
    const directKgCo2 = computedKwh * factorObj.value;

    const multiplier = period === 'ANNUAL' ? 1 : 12;
    const annualKwh = computedKwh * multiplier;
    const annualKgCo2 = directKgCo2 * multiplier;
    const annualTonnesCo2 = annualKgCo2 / 1000;

    // 1 mature urban tree absorbs approximately 21.8 kg CO2 per year
    const treeEquivalents = Math.round((annualKgCo2 / 21.8) * 10) / 10;
    // Average gasoline car emits ~0.172 kg CO2 / km
    const carKmEquivalent = Math.round(annualKgCo2 / 0.172);

    return {
      period,
      input_kwh: Math.round(computedKwh * 100) / 100,
      emission_factor: factorObj,
      period_emissions_kg_co2: Math.round(directKgCo2 * 100) / 100,
      projected_annual_kwh: Math.round(annualKwh * 100) / 100,
      projected_annual_kg_co2: Math.round(annualKgCo2 * 100) / 100,
      projected_annual_tco2: Math.round(annualTonnesCo2 * 100) / 100,
      environmental_benchmarks: {
        trees_required_to_offset: treeEquivalents,
        car_distance_equivalent_km: carKmEquivalent,
        smart_reduction_potential_kwh: Math.round(annualKwh * 0.22) // ~22% avoidable vacancy waste
      }
    };
  }

  calculateTravel({
    mode = 'PETROL_CAR',
    distance_km = 15,
    occupants = 1,
    trips_per_week = 5,
    weeks_per_year = 40
  }) {
    const transportConfig = EMISSION_FACTORS.transport[mode] || EMISSION_FACTORS.transport.PETROL_CAR;
    const dist = Math.max(0.1, Number(distance_km) || 0);
    const validOccupants = Math.max(1, parseInt(occupants, 10) || 1);

    const tripTotalKgCo2 = dist * transportConfig.factor_per_km;
    // Standard ISO allocation: trip total divided by occupants
    const allocatedPerOccupantKgCo2 = tripTotalKgCo2 / validOccupants;

    const annualTrips = (Number(trips_per_week) || 5) * 2 * (Number(weeks_per_year) || 40); // 2 legs per day
    const annualAllocatedKgCo2 = allocatedPerOccupantKgCo2 * annualTrips;
    const annualTripTotalKgCo2 = tripTotalKgCo2 * annualTrips;

    let fuelConsumedLitres = null;
    if (transportConfig.avg_efficiency_km_per_l) {
      fuelConsumedLitres = Math.round((dist / transportConfig.avg_efficiency_km_per_l) * 100) / 100;
    }

    return {
      mode,
      mode_name: transportConfig.name,
      distance_km: dist,
      occupants: validOccupants,
      trip_total_kg_co2: Math.round(tripTotalKgCo2 * 1000) / 1000,
      allocated_per_occupant_kg_co2: Math.round(allocatedPerOccupantKgCo2 * 1000) / 1000,
      annual_trips_count: annualTrips,
      annual_allocated_kg_co2: Math.round(annualAllocatedKgCo2 * 100) / 100,
      annual_allocated_tco2: Math.round((annualAllocatedKgCo2 / 1000) * 100) / 100,
      annual_vehicle_total_kg_co2: Math.round(annualTripTotalKgCo2 * 100) / 100,
      fuel_consumed_litres_per_trip: fuelConsumedLitres,
      emission_factor_used: {
        rate: transportConfig.factor_per_km,
        unit: transportConfig.unit,
        disclaimer: transportConfig.disclaimer
      },
      carpool_efficiency_note: validOccupants > 1
        ? `Carpooling with ${validOccupants} occupants reduces personal allocated footprint by ${Math.round((1 - 1 / validOccupants) * 100)}%. Note: Vehicle tailpipe emission remains ${Math.round(tripTotalKgCo2 * 100) / 100} kg CO2.`
        : 'Solo commute mode. Adding 1 carpool rider cuts personal footprint in half.'
    };
  }

  calculateEquipment({
    items = [],
    factor_id = 'CEA_V19_FY2022_23_DEMO',
    cost_per_kwh = 8.50
  }) {
    const factorObj = EMISSION_FACTORS.grid.find(f => f.id === factor_id) || EMISSION_FACTORS.grid[0];
    
    let totalActivePowerWatts = 0;
    let totalDailyKwh = 0;
    let totalWasteKwh = 0;

    const breakdown = items.map((item, idx) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const watts = Math.max(0, Number(item.rated_power_w || item.watts) || 100);
      const activeHours = Math.min(24, Math.max(0, Number(item.active_hours_day) || 8));
      const vacantHours = Math.min(24 - activeHours, Math.max(0, Number(item.vacant_waste_hours_day) || 0));

      const totalItemWatts = watts * qty;
      const dailyProductiveKwh = (totalItemWatts * activeHours) / 1000;
      const dailyWasteKwh = (totalItemWatts * vacantHours) / 1000;
      const totalDailyItemKwh = dailyProductiveKwh + dailyWasteKwh;

      totalActivePowerWatts += totalItemWatts;
      totalDailyKwh += totalDailyItemKwh;
      totalWasteKwh += dailyWasteKwh;

      return {
        id: item.id || `eq-calc-${idx}`,
        name: item.name || `Device ${idx + 1}`,
        quantity: qty,
        rated_power_w: watts,
        total_load_w: totalItemWatts,
        daily_kwh: Math.round(totalDailyItemKwh * 100) / 100,
        daily_waste_kwh: Math.round(dailyWasteKwh * 100) / 100,
        daily_emissions_kg_co2: Math.round(totalDailyItemKwh * factorObj.value * 100) / 100,
        avoidable_waste_kg_co2: Math.round(dailyWasteKwh * factorObj.value * 100) / 100,
        waste_pct: totalDailyItemKwh > 0 ? Math.round((dailyWasteKwh / totalDailyItemKwh) * 100) : 0
      };
    });

    const operatingDaysYear = 260; // Academic days
    const annualTotalKwh = totalDailyKwh * operatingDaysYear;
    const annualWasteKwh = totalWasteKwh * operatingDaysYear;
    const annualTotalKgCo2 = annualTotalKwh * factorObj.value;
    const annualWasteKgCo2 = annualWasteKwh * factorObj.value;
    const annualFinancialWasteUsd = annualWasteKwh * cost_per_kwh;

    return {
      items_count: items.length,
      connected_power_kw: Math.round((totalActivePowerWatts / 1000) * 100) / 100,
      daily_total_kwh: Math.round(totalDailyKwh * 100) / 100,
      daily_waste_kwh: Math.round(totalWasteKwh * 100) / 100,
      annual_total_tco2: Math.round((annualTotalKgCo2 / 1000) * 100) / 100,
      annual_avoidable_waste_tco2: Math.round((annualWasteKgCo2 / 1000) * 100) / 100,
      annual_cost_savings_potential_usd: Math.round(annualFinancialWasteUsd * 100) / 100,
      breakdown
    };
  }
}

const calculatorService = new CarbonCalculatorService();
module.exports = {
  EMISSION_FACTORS,
  calculatorService
};
