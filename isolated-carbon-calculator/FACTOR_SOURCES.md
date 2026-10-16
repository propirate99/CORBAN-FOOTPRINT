# Emission Factor Catalog & Provenance Documentation

This document records the exact emission factors, conversion ratios, reference sources, and scientific boundaries utilized by the **Isolated Carbon Footprint Calculator**.

---

## 1. Grid Electricity Factor

| Attribute | Specification |
| :--- | :--- |
| **Factor ID** | `CEA_V19_FY2022_23_DEMO` |
| **Factor Value** | **0.716 kg CO₂ / kWh** |
| **Reference Source** | Central Electricity Authority (CEA), CO₂ Baseline Database for the Indian Power Sector, Version 19.0 |
| **Reporting Period** | FY 2022–2023 |
| **Geographic Scope** | India |
| **Status** | **Historical demonstration factor** |
| **Emissions Boundary** | Direct grid generation-end operational CO₂ emissions only. |
| **Exclusions** | Excludes Transmission & Distribution (T&D) losses, auxiliary substation consumptions, and Scope 3 capital goods lifecycle emissions. |
| **Explicit Caveat** | **Do not label this factor as current, latest, or an audited corporate reporting recommendation.** This is a static historical reference calibrated for educational demonstration within this hackathon module. |

---

## 2. Motor Gasoline (Petrol) Reference Factor

| Attribute | Specification |
| :--- | :--- |
| **Factor ID** | `EPA_GASOLINE_TAILPIPE_REFERENCE` |
| **Source Factor Value** | **8.887 kg CO₂ per US gallon** |
| **Unit Conversion** | Divided by standard US liquid gallon volume: `3.785411784 litres/gallon` |
| **Computed Metric Value**| **2.347697... kg CO₂ / litre** (`8.887 / 3.785411784`) |
| **Reference Source** | United States Environmental Protection Agency (US EPA) Greenhouse Gas Emission Factors Hub |
| **Geographic Scope** | United States reference standard |
| **Emissions Boundary** | **Tailpipe CO₂ only** |
| **Mandatory Label** | *"US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions."* |
| **Exclusions** | Excludes upstream crude extraction, petroleum refining, transport, distribution, ethanol/biofuel blending variations, CH₄, N₂O, and vehicle manufacturing embodied emissions. |

---

## 3. Diesel Fuel Reference Factor

| Attribute | Specification |
| :--- | :--- |
| **Factor ID** | `EPA_DIESEL_TAILPIPE_REFERENCE` |
| **Source Factor Value** | **10.180 kg CO₂ per US gallon** |
| **Unit Conversion** | Divided by standard US liquid gallon volume: `3.785411784 litres/gallon` |
| **Computed Metric Value**| **2.689271... kg CO₂ / litre** (`10.180 / 3.785411784`) |
| **Reference Source** | United States Environmental Protection Agency (US EPA) Greenhouse Gas Emission Factors Hub |
| **Geographic Scope** | United States reference standard |
| **Emissions Boundary** | **Tailpipe CO₂ only** |
| **Mandatory Label** | *"US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions."* |
| **Exclusions** | Excludes upstream crude extraction, petroleum refining, distribution, biodiesel blending variations, non-CO₂ greenhouse gases (CH₄, N₂O), and full lifecycle vehicle manufacturing. |

---

## 4. Scientific Labels & Accounting Principles

1. **CO₂ vs. CO₂e:**
   * Outputs from this calculator represent direct $\text{CO}_2$ emissions only.
   * Outputs are **never** labeled as $\text{CO}_2e$ because non-$\text{CO}_2$ greenhouse gases (methane $\text{CH}_4$, nitrous oxide $\text{N}_2\text{O}$) and indirect radiative forcing are not quantified by these reference factors.
2. **Trip Total vs. Occupant Allocation:**
   * Shared travel emissions divide the trip's direct fuel burn equally among entered occupants for personal accounting:
     $$\text{allocatedKgCo2PerOccupant} = \frac{\text{totalTripKgCo2}}{\text{occupants}}$$
   * **Allocation does not reduce vehicle tailpipe emissions.** The vehicle still emits $\text{totalTripKgCo2}$.
   * Allocated per-occupant shares must never be summed back into the vehicle's total trip emission figure.
3. **Footprint Completeness Disclaimer:**
   * This module displays: **“Estimated CO2 from the activities entered.”**
   * It does not claim to measure an exhaustive or audited personal, organizational, or institutional footprint.
4. **External Source Verification Disclosure:**
   * These factors were pre-configured into the system catalog based on standard historical regulatory benchmark datasets.
   * **No live external web verification or automated API fetch was performed**, avoiding invented URLs or unverified real-time certifications.
