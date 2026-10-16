package in.campustwin.isolatedcalculator;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CalculatorService {

    private static final String NOTICE_TEXT = "Estimated CO2 from the activities entered.";

    public CalculationResult calculateElectricity(ElectricityRequest request) {
        if (request == null || request.kwh() == null) {
            throw new IllegalArgumentException("Electricity request and kwh must not be null");
        }
        double kwh = request.kwh();
        validateFiniteNumber(kwh, "kwh");
        if (kwh < 0) {
            throw new IllegalArgumentException("kwh cannot be negative");
        }

        FactorDto factor = FactorCatalog.getFactor(FactorCatalog.ELECTRICITY_FACTOR_ID);
        double estimatedKgCo2 = kwh * factor.value();

        Map<String, Object> inputDetails = new LinkedHashMap<>();
        inputDetails.put("kwh", kwh);

        Map<String, Object> quantities = new LinkedHashMap<>();
        quantities.put("kwh", kwh);
        quantities.put("kwhUnit", "kWh");
        quantities.put("estimatedKgCo2", estimatedKgCo2);
        quantities.put("co2Unit", "kg CO2");

        List<String> assumptions = List.of(
                "Grid emission factor based on CEA CO2 Baseline Database v19.0 (FY 2022-23) for India.",
                "Historical demonstration factor; not an audited reporting recommendation or real-time marginal factor.",
                "Accounts for generation operational direct CO2 emissions only; does not claim full lifecycle CO2e or T&D loss accounting."
        );

        String formula = String.format("estimatedKgCo2 = kwh * electricityFactor (%.4f kg CO2/kWh)", factor.value());

        return new CalculationResult(
                UUID.randomUUID().toString(),
                "ELECTRICITY",
                Instant.now(),
                inputDetails,
                quantities,
                estimatedKgCo2,
                null,
                List.of(factor),
                formula,
                assumptions,
                NOTICE_TEXT
        );
    }

    public CalculationResult calculateEquipment(EquipmentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Equipment request must not be null");
        }
        if (request.quantity() == null || request.quantity() < 1) {
            throw new IllegalArgumentException("quantity must be a positive integer (at least 1)");
        }
        if (request.wattsPerUnit() == null || request.wattsPerUnit() < 0) {
            throw new IllegalArgumentException("wattsPerUnit cannot be negative");
        }
        if (request.hoursPerDay() == null || request.hoursPerDay() < 0 || request.hoursPerDay() > 24) {
            throw new IllegalArgumentException("hoursPerDay must be between 0 and 24");
        }
        if (request.days() == null || request.days() < 1 || request.days() > 366) {
            throw new IllegalArgumentException("days must be an integer between 1 and 366");
        }

        validateFiniteNumber(request.wattsPerUnit(), "wattsPerUnit");
        validateFiniteNumber(request.hoursPerDay(), "hoursPerDay");

        double estimatedKwh = (request.quantity() * request.wattsPerUnit() * request.hoursPerDay() * request.days()) / 1000.0;
        FactorDto factor = FactorCatalog.getFactor(FactorCatalog.ELECTRICITY_FACTOR_ID);
        double estimatedKgCo2 = estimatedKwh * factor.value();

        Map<String, Object> inputDetails = new LinkedHashMap<>();
        inputDetails.put("quantity", request.quantity());
        inputDetails.put("wattsPerUnit", request.wattsPerUnit());
        inputDetails.put("hoursPerDay", request.hoursPerDay());
        inputDetails.put("days", request.days());

        Map<String, Object> quantities = new LinkedHashMap<>();
        quantities.put("estimatedKwh", estimatedKwh);
        quantities.put("kwhUnit", "kWh");
        quantities.put("estimatedKgCo2", estimatedKgCo2);
        quantities.put("co2Unit", "kg CO2");

        List<String> assumptions = List.of(
                "Assumes constant power draw at the entered rated wattage throughout operating duration.",
                "Rated power is an equipment nameplate rating, not a sub-metered power measurement.",
                "Variable-power loads require a dynamic load profile model.",
                "No automatic equipment control is executed; no safety claims are inferred.",
                "Do not add this estimate to electricity bills that already account for this equipment's power."
        );

        String formula = String.format(
                "estimatedKwh = (quantity * wattsPerUnit * hoursPerDay * days) / 1000; estimatedKgCo2 = estimatedKwh * %.4f kg CO2/kWh",
                factor.value()
        );

        return new CalculationResult(
                UUID.randomUUID().toString(),
                "EQUIPMENT",
                Instant.now(),
                inputDetails,
                quantities,
                estimatedKgCo2,
                null,
                List.of(factor),
                formula,
                assumptions,
                NOTICE_TEXT
        );
    }

    public CalculationResult calculateTravel(TravelRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Travel request must not be null");
        }
        request.validateMethodAndBounds();

        if (request.occupants() == null || request.occupants() < 1 || request.occupants() > 100) {
            throw new IllegalArgumentException("occupants must be an integer from 1 to 100");
        }

        TravelRequest.FuelType fuelType = request.parsedFuelType();
        String factorId = (fuelType == TravelRequest.FuelType.PETROL)
                ? FactorCatalog.PETROL_FACTOR_ID
                : FactorCatalog.DIESEL_FACTOR_ID;
        FactorDto factor = FactorCatalog.getFactor(factorId);

        double fuelLitres;
        String method;
        String formula;

        if (request.isFuelMethod()) {
            method = "FUEL_LITRES";
            fuelLitres = request.fuelLitres();
            formula = String.format("totalKgCo2 = fuelLitres (%.3f L) * fuelFactor (%.5f kg CO2/L)", fuelLitres, factor.value());
        } else {
            method = "DISTANCE_AND_MILEAGE";
            fuelLitres = request.distanceKm() / request.mileageKmPerLitre();
            formula = String.format(
                    "estimatedFuelLitres = distanceKm (%.2f km) / mileage (%.2f km/L) = %.4f L; totalKgCo2 = estimatedFuelLitres * fuelFactor (%.5f kg CO2/L)",
                    request.distanceKm(), request.mileageKmPerLitre(), fuelLitres, factor.value()
            );
        }

        double totalKgCo2 = fuelLitres * factor.value();
        double allocatedKgCo2PerOccupant = totalKgCo2 / request.occupants();

        Map<String, Object> inputDetails = new LinkedHashMap<>();
        inputDetails.put("fuelType", fuelType.name());
        inputDetails.put("calculationMethod", method);
        inputDetails.put("occupants", request.occupants());
        if (request.fuelLitres() != null) {
            inputDetails.put("enteredFuelLitres", request.fuelLitres());
        }
        if (request.distanceKm() != null) {
            inputDetails.put("enteredDistanceKm", request.distanceKm());
            inputDetails.put("enteredMileageKmPerLitre", request.mileageKmPerLitre());
        }

        Map<String, Object> quantities = new LinkedHashMap<>();
        quantities.put("fuelLitres", fuelLitres);
        quantities.put("fuelUnit", "Litres");
        quantities.put("totalTripKgCo2", totalKgCo2);
        quantities.put("allocatedKgCo2PerOccupant", allocatedKgCo2PerOccupant);
        quantities.put("co2Unit", "kg CO2");

        List<String> assumptions = List.of(
                "US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.",
                "Boundary: Tailpipe direct CO2 only. Excludes CH4, N2O, and full lifecycle vehicle manufacturing impacts.",
                "Allocation divides trip emissions equally among occupants for personal footprint accounting; it does NOT physically reduce vehicle tailpipe emissions.",
                "Do not sum allocated individual shares back into the trip total."
        );

        return new CalculationResult(
                UUID.randomUUID().toString(),
                "TRAVEL",
                Instant.now(),
                inputDetails,
                quantities,
                totalKgCo2,
                allocatedKgCo2PerOccupant,
                List.of(factor),
                formula,
                assumptions,
                NOTICE_TEXT
        );
    }

    private void validateFiniteNumber(double value, String fieldName) {
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            throw new IllegalArgumentException(fieldName + " must be a finite numeric value");
        }
    }
}
