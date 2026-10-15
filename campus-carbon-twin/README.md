# Campus Carbon Twin (CCT)

Campus Carbon Twin is an edge-aware digital twin platform for universities and institutions to monitor, simulate, and mitigate campus energy waste and operational carbon emissions in real-time.

```
       [ Edge Vision Camera ]
                 │ (Zero-PII Occupancy Counts & Confidence)
                 ▼
      [ Spring Boot Backend ] ◄──── [ Scenario Simulation Engine ]
                 │                                │
                 ▼                                ▼
       [ PostgreSQL Database ] ────► [ Action Automation / LLM Explain ]
                 │
                 ▼
     [ Vite + React Dashboard ]
```

## Features

- **Digital Twin Campus Map**: Real-time visualization of buildings, floor plans, and rooms color-coded by carbon intensity and live operational draw.
- **Edge Vision AI (Zero-PII)**: In-browser camera inference using lightweight TensorFlow Lite / WASM models to count occupancy locally without ever transmitting or storing raw video or biometric data.
- **Waste & Anomaly Detection**: Rule-based detection flags vacant rooms running active HVAC, projectors, and excessive lighting.
- **Scenario Simulation Engine**: What-if carbon impact simulation (HVAC setpoint changes, scheduled night shutoffs, solar installations).
- **Explainable Actions & LLM Reasoning**: Natural language justifications and ROI calculations for facilities managers.
- **Personal Footprint Calculator**: Interactive student and faculty calculator for campus daily commute and equipment usage.

## Tech Stack

- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, Lucide Icons, Vitest.
- **Backend**: Java 21, Spring Boot 3.2, Spring Data JPA, Flyway, PostgreSQL.
- **AI / Edge**: TensorFlow Lite / WASM Edge Inference, Google Gemini API for mitigation explanations.
- **Infrastructure**: Docker Compose, PostgreSQL 16.

## Quickstart

### 1. Run with Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api/v1`
- Swagger / OpenAPI Contract: `docs/api-contract.yaml`

### 2. Manual Development

#### Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```

#### Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```

## Documentation

- [Architecture & Design](docs/architecture.md)
- [API Contract (OpenAPI 3.0)](docs/api-contract.yaml)
- [Zero-PII Edge Privacy Architecture](docs/privacy.md)
- [Assumptions & Factor Methodology](docs/assumptions.md)
- [Testing Checklist](docs/testing-checklist.md)
- [Demo Script](docs/demo-script.md)
