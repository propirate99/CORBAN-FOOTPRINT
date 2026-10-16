package in.campustwin.explanation;

import java.util.List;

/**
 * Sanitized, minimal explanation context.
 *
 * Strict Privacy Boundaries:
 * - NO camera frames or image data.
 * - NO face detections or biometric data.
 * - NO student or personnel names.
 * - NO medical, watch, or health data.
 * - NO raw system logs or internal API keys.
 * - Controlled equipment categories and standardized descriptions only.
 * - Numerical savings metrics are omitted from the LLM input to prevent invented calculations.
 */
public record ExplanationContext(
    String scenarioId,
    String scenarioType,
    String roomId,
    String observationDescription,
    String currentObservationState,
    String currentEligibility,
    String selectedEquipmentType,
    String equipmentStateBasis,
    int scenarioDurationMinutes,
    List<String> assumptions,
    List<String> forbiddenActions
) {}
