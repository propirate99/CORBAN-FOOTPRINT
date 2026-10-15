package in.campustwin.isolatedcalculator;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TravelRequest(
        @NotNull(message = "fuelType is required (must be PETROL or DIESEL)")
        String fuelType,

        Double fuelLitres,

        Double distanceKm,

        Double mileageKmPerLitre,

        @NotNull(message = "occupants is required")
        @Min(value = 1, message = "occupants must be an integer from 1 to 100")
        @Max(value = 100, message = "occupants must be an integer from 1 to 100")
        Integer occupants
) {
    public enum FuelType {
        PETROL,
        DIESEL
    }

    public FuelType parsedFuelType() {
        if (fuelType == null || fuelType.trim().isEmpty()) {
            throw new IllegalArgumentException("fuelType is required");
        }
        try {
            return FuelType.valueOf(fuelType.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported fuel type '" + fuelType + "'. Supported types: PETROL, DIESEL");
        }
    }

    public boolean isFuelMethod() {
        return fuelLitres != null;
    }

    public boolean isDistanceMethod() {
        return distanceKm != null || mileageKmPerLitre != null;
    }

    public void validateMethodAndBounds() {
        parsedFuelType(); // Validates enum support

        boolean hasFuel = fuelLitres != null;
        boolean hasDist = distanceKm != null;
        boolean hasMileage = mileageKmPerLitre != null;

        if (hasFuel && (hasDist || hasMileage)) {
            throw new IllegalArgumentException("Conflicting travel input methods. Provide either fuelLitres OR (distanceKm and mileageKmPerLitre), not both.");
        }

        if (!hasFuel && !hasDist && !hasMileage) {
            throw new IllegalArgumentException("Missing travel calculation method. Provide either fuelLitres OR (distanceKm and mileageKmPerLitre).");
        }

        if (hasFuel) {
            if (Double.isNaN(fuelLitres) || Double.isInfinite(fuelLitres)) {
                throw new IllegalArgumentException("fuelLitres must be a finite number");
            }
            if (fuelLitres < 0) {
                throw new IllegalArgumentException("fuelLitres cannot be negative");
            }
            if (fuelLitres > 50000.0) {
                throw new IllegalArgumentException("fuelLitres exceeds maximum allowable limit of 50,000 litres");
            }
        } else {
            if (!hasDist || !hasMileage) {
                throw new IllegalArgumentException("Partial distance-method input. Both distanceKm and mileageKmPerLitre are required for distance-based calculation.");
            }
            if (Double.isNaN(distanceKm) || Double.isInfinite(distanceKm)) {
                throw new IllegalArgumentException("distanceKm must be a finite number");
            }
            if (Double.isNaN(mileageKmPerLitre) || Double.isInfinite(mileageKmPerLitre)) {
                throw new IllegalArgumentException("mileageKmPerLitre must be a finite number");
            }
            if (distanceKm < 0) {
                throw new IllegalArgumentException("distanceKm cannot be negative");
            }
            if (distanceKm > 1000000.0) {
                throw new IllegalArgumentException("distanceKm exceeds maximum allowable limit of 1,000,000 km");
            }
            if (mileageKmPerLitre <= 0) {
                throw new IllegalArgumentException("mileageKmPerLitre must be strictly greater than zero");
            }
            if (mileageKmPerLitre > 1000.0) {
                throw new IllegalArgumentException("mileageKmPerLitre exceeds reasonable limit of 1,000 km/litre");
            }
        }
    }
}
