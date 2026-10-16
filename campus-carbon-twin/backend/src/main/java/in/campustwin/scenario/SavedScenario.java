package in.campustwin.scenario;

import java.time.Instant;
import java.util.List;

public record SavedScenario(
    String id,
    String roomId,
    String scenarioType,
    String title,
    String description,
    String observationDescription,
    String selectedEquipmentType,
    String equipmentStateBasis,
    int scenarioDurationMinutes,
    double estimatedAvoidedKwh,
    double estimatedAvoidedKgCo2,
    String factorSource,
    int factorReportingYear,
    double factorValue,
    String factorUnit,
    String evidenceLevel,
    Instant createdAt,
    List<String> assumptions,
    List<String> forbiddenActions
) {}
