# Integration Guide: Campus Carbon Footprint Calculator

This guide explains how to integrate the **Isolated Carbon Footprint Calculator** into the main **Campus Carbon Twin (CCT)** platform once the team is ready.

> **CRITICAL RULE**: Do not apply these changes automatically during hackathon development without team consensus. An unapplied patch is provided at `integrate-calculator.patch`.

---

## 1. Frontend Integration

### A. Component Import
The calculator is exported as a self-contained, modular component:

```tsx
import { CarbonCalculator } from '../../../../isolated-carbon-calculator/frontend/src/components/CarbonCalculator';
```

### B. Required Dependencies
The isolated calculator uses standard dependencies that match the main frontend repository:
* `react` (^18.2.0)
* `react-dom` (^18.2.0)
* `clsx` (^2.1.0)
* `lucide-react` (^0.344.0)

No additional external CSS frameworks are required. All styling is encapsulated inside `calculator.css` under the root selector `.isolated-calc-root` to ensure **zero style collisions** with existing Tailwind or CSS modules.

### C. Setting `apiBaseUrl`
The `<CarbonCalculator />` component accepts an optional `apiBaseUrl` prop:

```tsx
// Using Vite / Nginx reverse proxy (Default)
<CarbonCalculator apiBaseUrl="/api/v1/calculator" />

// Direct microservice access during local multi-service testing
<CarbonCalculator apiBaseUrl="http://localhost:8085/api/v1/calculator" />
```

---

## 2. Backend Integration Architectures

The team has two architectural options for integrating the backend calculation engine:

### Option A: Standalone Microservice (Recommended for Hackathons)
* Keep the isolated backend running as a lightweight independent service on port `8085`.
* Update the frontend Vite config (or production Nginx reverse proxy) to forward `/api/v1/calculator/*` to `http://localhost:8085`.
* **Benefits:** Zero risk of breaking database migrations, JPA entities, or Gemini AI endpoints in the main backend.

### Option B: Monolithic In-Process Package Merge
* Copy the Java files from `isolated-carbon-calculator/backend/src/main/java/in/campustwin/isolatedcalculator/` into `campus-carbon-twin/backend/src/main/java/in/campustwin/calculator/`.
* Because `CalculatorController` and `CalculatorService` are stateless and rely only on standard `@RestController`, `@Service`, and `jakarta.validation`, they immediately activate under the main application's component scan at `@ComponentScan("in.campustwin")`.
* No database migrations (`V3__...`) are needed because the calculator is fully deterministic and stateless in-memory.

---

## 3. Security, Authentication & CORS

1. **Authentication & Session State:**
   * In this release, calculation endpoints (`POST /electricity`, `POST /equipment`, `POST /travel`, `GET /factors`) are unauthenticated utility tools.
   * If the main project introduces Spring Security / JWT authentication, configure `/api/v1/calculator/**` with `.permitAll()` or inject the authenticated user's principal if personal history logging is implemented.
2. **CORS:**
   * In local development, the Vite dev proxy avoids browser CORS restrictions completely.
   * For cross-origin production hosting, add explicit CORS configuration restricting `allowedOrigins` to the trusted university dashboard domain (`http://localhost:5173`). Wildcard `*` CORS should never be used.
3. **Privacy & Zero-PII Compliance:**
   * The calculator adheres strictly to the project's Zero-PII policy: no names, student IDs, locations, camera feeds, or smartwatch telemetry are collected or stored.

---

## 4. Existing Project Files Affected Upon Future Integration

If the team decides to merge this module into the primary application, the following specific files would need modifications:

| File Path | Description of Required Change |
| :--- | :--- |
| `campus-carbon-twin/frontend/src/features/calculator/PersonalCalculatorPage.tsx` | Replace mock slider calculations with `<CarbonCalculator apiBaseUrl="/api/v1/calculator" />`. |
| `campus-carbon-twin/frontend/vite.config.ts` | (If Option A) Ensure proxy routes `/api/v1/calculator` to port `8085`. |
| `campus-carbon-twin/compose.yaml` | (If Option A) Add `calculator-backend` service container on port `8085`. |

An unapplied git patch is ready for review at `isolated-carbon-calculator/integrate-calculator.patch`.
