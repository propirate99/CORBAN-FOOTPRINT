package in.campustwin.isolatedcalculator;

public record FactorDto(
        String id,
        String name,
        double value,
        String unit,
        String sourceName,
        String geography,
        String reportingPeriodOrStatus,
        String emissionsBoundary,
        String limitations,
        String notice
) {}
