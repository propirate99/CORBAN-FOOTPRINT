-- =============================================================================
-- Migration 004: Seed reference emission factors
-- Inserts representative values for the Indian grid and common fuels.
-- All factors are public reference data; no campus-private information.
-- Sources: CEA Grid Emission Factors India 2022-23, IPCC AR5 GWP100.
-- =============================================================================

begin;

insert into public.emission_factors
  (name, value, unit, geography, reporting_year, source_reference, gas_basis, factor_type)
values
  -- India national grid average (CEA 2022-23)
  (
    'India Grid Average Electricity',
    0.71600,
    'kgCO2e/kWh',
    'IN',
    2023,
    'Central Electricity Authority, CO2 Baseline Database India v18 (2023)',
    'CO2E',
    'GRID_ELECTRICITY'
  ),

  -- Southern Regional Grid (relevant for most South-Indian campuses)
  (
    'India Southern Grid Electricity',
    0.60300,
    'kgCO2e/kWh',
    'IN-South',
    2023,
    'Central Electricity Authority, CO2 Baseline Database India v18 (2023)',
    'CO2E',
    'GRID_ELECTRICITY'
  ),

  -- Diesel (stationary combustion)
  (
    'Diesel Stationary Combustion',
    2.68000,
    'kgCO2e/litre',
    'GLOBAL',
    2022,
    'IPCC AR5 GWP100; DEFRA Conversion Factors 2022',
    'CO2E',
    'DIESEL'
  ),

  -- LPG (cooking/lab)
  (
    'LPG Combustion',
    1.51000,
    'kgCO2e/litre',
    'GLOBAL',
    2022,
    'IPCC AR5 GWP100; DEFRA Conversion Factors 2022',
    'CO2E',
    'LPG'
  ),

  -- Petrol (vehicle fleet)
  (
    'Petrol Combustion',
    2.31400,
    'kgCO2e/litre',
    'GLOBAL',
    2022,
    'IPCC AR5 GWP100; DEFRA Conversion Factors 2022',
    'CO2E',
    'PETROL'
  );

commit;

-- =============================================================================
-- NOTES
-- 1. Factor values are immutable reference data after insertion.
--    Do not UPDATE existing rows.  Insert new rows for updated years.
-- 2. Scenarios copy the factor value at creation time into
--    factor_snapshot_json so historical calculations remain accurate even
--    after new factors are added.
-- 3. The emission_factors_read_authenticated RLS policy (migration 002)
--    allows any signed-in user to read these rows.  This is intentional
--    because the values are published public reference data.
-- =============================================================================
