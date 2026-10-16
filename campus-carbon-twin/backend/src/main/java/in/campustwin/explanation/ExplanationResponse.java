package in.campustwin.explanation;

import java.time.Instant;
import java.util.List;

/**
 * Authoritative scenario explanation response.
 *
 * Strict boundary:
 * The backend owns metrics, mandatorySafetyChecks, limitations, eligibility,
 * evidenceLevel, and actionPermission. The model supplies only the nested explanation.
 */
public record ExplanationResponse(
    String scenarioId,
    String roomId,
    String source,               // "GENAI" | "TEMPLATE"
    String fallbackReason,       // null when GENAI, explanatory message when TEMPLATE
    Instant generatedAt,
    String currentEligibility,   // "ELIGIBLE" | "INELIGIBLE_OCCUPIED" | "INELIGIBLE_STALE"
    String evidenceLevel,        // "SIMULATED"
    Metrics metrics,
    FactorMetadata factorMetadata,
    GeneratedExplanation explanation,
    List<String> mandatorySafetyChecks,
    List<String> limitations,
    String actionPermission      // "HUMAN_APPROVAL_REQUIRED"
) {
    public record Metrics(
        double estimatedAvoidedKwh,
        double estimatedAvoidedKgCo2
    ) {}

    public record FactorMetadata(
        String factorSource,
        int reportingYear,
        double factorValue,
        String factorUnit
    ) {}
}
