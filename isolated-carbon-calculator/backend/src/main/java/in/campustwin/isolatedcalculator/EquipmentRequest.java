package in.campustwin.isolatedcalculator;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record EquipmentRequest(
        @NotNull(message = "quantity is required")
        @Min(value = 1, message = "quantity must be a positive integer (at least 1)")
        @Max(value = 100000, message = "quantity exceeds maximum allowable value of 100,000")
        Integer quantity,

        @NotNull(message = "wattsPerUnit is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "wattsPerUnit cannot be negative")
        @DecimalMax(value = "1000000.0", message = "wattsPerUnit exceeds maximum of 1,000,000 W")
        Double wattsPerUnit,

        @NotNull(message = "hoursPerDay is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "hoursPerDay must be between 0 and 24")
        @DecimalMax(value = "24.0", inclusive = true, message = "hoursPerDay cannot exceed 24")
        Double hoursPerDay,

        @NotNull(message = "days is required")
        @Min(value = 1, message = "days must be an integer between 1 and 366")
        @Max(value = 366, message = "days must be an integer between 1 and 366")
        Integer days
) {}
