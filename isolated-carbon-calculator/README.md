# Isolated Campus Carbon Footprint Calculator

A modular, highly defensive, and deterministic carbon footprint calculation module designed for the **Campus Carbon Twin** hackathon project.

This module is 100% self-contained in `isolated-carbon-calculator/` and does not modify, mutate, or alter any pre-existing project code or database state.

---

## 1. System Overview

```
 [ Browser Client (Port 5175) ]
              │
              │ (Vite Proxy /api)
              ▼
 [ Spring Boot Backend (Port 8085) ]
              │
              ├── Factor Catalog (CEA v19, US EPA Tailpipe References)
              └── Deterministic Arithmetic Engine (Zero-PII, In-Memory)
```

* **Frontend:** Vite, React 18, TypeScript, Scoped CSS (`.isolated-calc-root`), Lucide Icons.
* **Backend:** Java 21, Spring Boot 3.2.4, Jakarta Validation, JUnit 5 MockMvc.
* **Ports Used:**
  * Frontend: `http://localhost:5175` (avoids conflict with main project on `5173`)
  * Backend API: `http://127.0.0.1:8085` (avoids conflict with main project on `8080`)

---

## 2. Prerequisites

* **Node.js:** v18.0.0+ (Tested with v24.19.0 and npm 11.17.0)
* **Java / Maven:** JDK 21+ and Maven 3.9+ (or Docker)

---

## 3. Quickstart & Local Startup

### Running the Frontend
Open PowerShell in the frontend directory:
```powershell
cd isolated-carbon-calculator/frontend
npm.cmd install
npm.cmd run dev
```
Open your browser to: **`http://localhost:5175`**

### Running the Backend
In a separate terminal:
```powershell
cd isolated-carbon-calculator/backend
./mvnw.cmd spring-boot:run
```
The backend starts at: **`http://127.0.0.1:8085/api/v1/calculator`**

### Running with Docker (Headless Test Alternative)
To execute tests without installing local Java, run headlessly (without interactive `-it` flag):
```bash
docker run --rm -v "$PWD/backend:/app" -w /app maven:3.9.6-eclipse-temurin-21 mvn clean test
```

---

## 4. API Endpoints & Example Requests

Base URL: `http://127.0.0.1:8085/api/v1/calculator`

### 1. Electricity Calculation
**Endpoint:** `POST /electricity`

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8085/api/v1/calculator/electricity" -Method Post -ContentType "application/json" -Body '{"kwh": 100}'
```

**Response:**
```json
{
  "calculationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "activityType": "ELECTRICITY",
  "calculatedAt": "2026-10-15T12:00:00Z",
  "inputDetails": { "kwh": 100.0 },
  "quantities": { "kwh": 100.0, "kwhUnit": "kWh", "estimatedKgCo2": 71.6, "co2Unit": "kg CO2" },
  "estimatedKgCo2": 71.6,
  "allocatedKgCo2PerOccupant": null,
  "factorMetadata": [{
    "id": "CEA_V19_FY2022_23_DEMO",
    "name": "India Grid Electricity Emission Factor",
    "value": 0.716,
    "unit": "kg CO2/kWh",
    "sourceName": "CEA CO2 Baseline Database, Version 19.0",
    "geography": "India"
  }],
  "formula": "estimatedKgCo2 = kwh * electricityFactor (0.7160 kg CO2/kWh)",
  "notice": "Estimated CO2 from the activities entered."
}
```

### 2. Equipment Calculation
**Endpoint:** `POST /equipment`

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8085/api/v1/calculator/equipment" -Method Post -ContentType "application/json" -Body '{"quantity": 8, "wattsPerUnit": 20, "hoursPerDay": 2, "days": 1}'
```

### 3. Travel Distance Calculation
**Endpoint:** `POST /travel`

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8085/api/v1/calculator/travel" -Method Post -ContentType "application/json" -Body '{"fuelType": "PETROL", "distanceKm": 20, "mileageKmPerLitre": 40, "occupants": 2}'
```

### 4. Travel Fuel Calculation
**Endpoint:** `POST /travel`

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8085/api/v1/calculator/travel" -Method Post -ContentType "application/json" -Body '{"fuelType": "DIESEL", "fuelLitres": 2, "occupants": 1}'
```

### 5. Emission Factors Catalog
**Endpoint:** `GET /factors`

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8085/api/v1/calculator/factors"
```

### 6. Health Probe
**Endpoint:** `GET /health`

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8085/api/v1/calculator/health"
```

---

## 5. Troubleshooting & FAQ

* **Issue: `npm : File ... npm.ps1 cannot be loaded because running scripts is disabled`**
  * **Solution:** On Windows PowerShell, invoke npm as `npm.cmd install` and `npm.cmd run dev` to bypass PowerShell script execution restrictions safely.
* **Issue: Port conflict error (e.g. `EADDRINUSE 5175`)**
  * **Solution:** If port 5175 is occupied, change the `server.port` entry in `frontend/vite.config.ts`.
* **Issue: HTTP 400 Bad Request**
  * **Solution:** Ensure travel inputs do not provide both fuel litres and distance simultaneously, and ensure all numeric values are strictly positive and finite.

---

## 6. Known Limitations

1. **Stateless In-Memory:** Inputs and calculation runs are not saved to a persistent database.
2. **Tailpipe CO₂ Scope:** Fuel factors quantify tailpipe direct $\text{CO}_2$; they do not measure Scope 3 refinery lifecycle impacts or $\text{CH}_4/\text{N}_2\text{O}$.
3. **Constant Load Assumption:** Equipment wattage calculations assume fixed rated power; variable-frequency drives (e.g. HVAC inverters) require sub-metered telemetry.
