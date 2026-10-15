package in.campustwin.isolatedcalculator;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record ElectricityRequest(
        @NotNull(message = "kwh is required and cannot be null")
        @DecimalMin(value = "0.0", inclusive = true, message = "kwh cannot be negative")
        @DecimalMax(value = "10000000.0", message = "kwh exceeds upper limit of 10,000,000 kWh")
        Double kwh
) {}
