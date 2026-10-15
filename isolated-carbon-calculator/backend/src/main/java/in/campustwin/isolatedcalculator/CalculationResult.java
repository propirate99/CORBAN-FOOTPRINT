package in.campustwin.isolatedcalculator;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record CalculationResult(
        String calculationId,
        String activityType,
        Instant calculatedAt,
        Map<String, Object> inputDetails,
        Map<String, Object> quantities,
        double estimatedKgCo2,
        Double allocatedKgCo2PerOccupant,
        List<FactorDto> factorMetadata,
        String formula,
        List<String> assumptions,
        String notice
) {}
