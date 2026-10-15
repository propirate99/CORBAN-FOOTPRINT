# Test Execution & Verification Results

This document records the actual testing, compilation, static analysis, and file integrity verification results for the **Isolated Carbon Footprint Calculator**.

---

## 1. Test Execution Matrix

| Test Suite / Step | Target Scope | Command Executed | Result | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Dependency Install** | `isolated-carbon-calculator/frontend` | `npm.cmd install --prefer-offline` | **PASSED** | Added 69 packages successfully inside isolated `node_modules`. |
| **Frontend TypeScript & Build** | `isolated-carbon-calculator/frontend` | `npm.cmd run build` | **PASSED** | `tsc && vite build`: 38 modules transformed, 0 TypeScript errors, bundle generated in `dist/`. |
| **Protected File Integrity Baseline** | `campus-carbon-twin/` | `Get-ChildItem -File -Recurse \| Get-FileHash` | **PASSED** | 81 pre-existing project files hashed into `baseline_hashes.csv`. |
| **Protected File Integrity Verification** | `campus-carbon-twin/` | Compare SHA-256 against baseline | **PASSED** | **0 of 81 pre-existing files modified** (100% byte-for-byte identity confirmed). |
| **Backend Automated Unit Tests** | `isolated-carbon-calculator/backend` | `./mvnw.cmd test` | **ENVIRONMENT LIMITATION** | Java 21 is not installed on the host system PATH. `winget install Microsoft.OpenJDK.21` encountered `0x80072ee7: InternetOpenUrl() failed` due to environment sandbox network restrictions. Complete JUnit test suite covering all 14 criteria is written in `CalculatorServiceTest.java` and `CalculatorControllerTest.java`. |

---

## 2. Automated Backend Test Cases Implemented

The test suite in `CalculatorServiceTest.java` and `CalculatorControllerTest.java` covers all 14 acceptance criteria:

1. **Criterion 1 (100 kWh):** `testElectricity_100Kwh` verifies $100 \times 0.716 = 71.6\text{ kg CO}_2$.
2. **Criterion 2 (Equipment formula):** `testEquipment_Calculation` verifies 8 devices $\times$ 20 W $\times$ 2 h/day $\times$ 1 day = $0.32\text{ kWh}$ and $0.22912\text{ kg CO}_2$.
3. **Criterion 3 (Distance method):** `testTravel_DistanceMethod` verifies $20\text{ km} / 40\text{ km/L} = 0.5\text{ L}$ and direct tailpipe $\text{CO}_2 = 0.5 \times \text{petrol factor}$.
4. **Criterion 4 (Two occupants):** `testTravel_TwoOccupantsAllocation` verifies per-occupant allocation equals half the trip total while total vehicle emissions remain identical.
5. **Criterion 5 (Zero kWh):** `testElectricity_ZeroKwh` verifies $0\text{ kWh}$ yields $0\text{ kg CO}_2$.
6. **Criterion 6 (Negative inputs):** `testNegativeInput_Throws` verifies rejection of negative inputs across all categories.
7. **Criterion 7 (Zero mileage):** `testTravel_ZeroMileage_Throws` verifies zero mileage returns error.
8. **Criterion 8 (Zero occupants):** `testTravel_ZeroOccupants_Throws` verifies zero occupants returns error.
9. **Criterion 9 (Both travel methods):** `testTravel_BothMethodsProvided_Throws` verifies simultaneous fuel and distance inputs are rejected.
10. **Criterion 10 (Partial distance input):** `testTravel_PartialDistanceInput_Throws` verifies rejection of distance without mileage or vice versa.
11. **Criterion 11 (Missing required fields):** `testMissingFields_Throws` verifies null inputs return error.
12. **Criterion 12 (Unsupported fuel):** `testTravel_UnsupportedFuelType_Throws` verifies non-petrol/diesel fuel types are rejected.
13. **Criterion 13 (Operating hours > 24):** `testEquipment_Exceeding24Hours_Throws` verifies hours $> 24$ are rejected.
14. **Criterion 14 (Factor metadata):** `testFactorMetadataIncluded` verifies factor ID, source, geography, and limitations are returned with results.

---

## 3. Headless Docker Backend Test Command

To run the JUnit test suite on machines with Docker installed (using headless non-interactive mode without `-it`):

```bash
docker run --rm -v "$PWD/backend:/app" -w /app maven:3.9.6-eclipse-temurin-21 mvn clean test
```

---

## 4. Honest Disclosure: What Was Not Run Locally

* **Backend Live Execution on Host OS:** Host environment does not have Java 21 on `PATH`.
* **Live In-Browser Smoke Test:** In-browser live clicking was not simulated because backend was not active headlessly on this host.
