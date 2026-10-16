package in.campustwin.explanation;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Validates generated explanation prose against digital-twin domain rules,
 * safety constraints, and privacy boundaries.
 */
@Component
public class ExplanationValidator {

    public record ValidationResult(boolean isValid, String reason) {
        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String reason) {
            return new ValidationResult(false, reason);
        }
    }

    // Pattern detecting introduced numerical claims or invented calculations (e.g. "saves 150 kWh", "$50", "42%")
    private static final Pattern NUMERICAL_CLAIMS_PATTERN = Pattern.compile(
        "\\b\\d+(?:\\.\\d+)?\\s*(?:kwh|mwh|kg|ton|tons|dollars|\\$|%|percent)\\b",
        Pattern.CASE_INSENSITIVE
    );

    // Forbidden actions regex
    private static final Pattern FORBIDDEN_EMERGENCY_PATTERN = Pattern.compile(
        "(?:disable|switch off|turn off|cut|shut down)\\s+(?:the\\s+)?(?:emergency|exit|critical|ventilation)",
        Pattern.CASE_INSENSITIVE
    );

    // Overconfident certainty regex
    private static final Pattern OVERCONFIDENT_EMPTY_PATTERN = Pattern.compile(
        "\\b(?:room is empty|guaranteed empty|completely vacant|proven empty|100% empty)\\b",
        Pattern.CASE_INSENSITIVE
    );

    public ValidationResult validate(GeneratedExplanation explanation, ExplanationContext context) {
        if (explanation == null) {
            return ValidationResult.invalid("Explanation object is null");
        }

        // 1. Check required fields
        if (explanation.summary() == null || explanation.summary().isBlank()) {
            return ValidationResult.invalid("Explanation summary is missing or blank");
        }
        if (explanation.reason() == null || explanation.reason().isBlank()) {
            return ValidationResult.invalid("Explanation reason is missing or blank");
        }
        if (explanation.assumptions() == null || explanation.assumptions().isEmpty()) {
            return ValidationResult.invalid("Explanation assumptions list is missing or empty");
        }
        if (explanation.suggestedChecks() == null || explanation.suggestedChecks().isEmpty()) {
            return ValidationResult.invalid("Explanation suggestedChecks list is missing or empty");
        }

        // 2. Length limits
        if (explanation.summary().length() > 500) {
            return ValidationResult.invalid("Explanation summary exceeds 500 characters");
        }
        if (explanation.reason().length() > 1000) {
            return ValidationResult.invalid("Explanation reason exceeds 1000 characters");
        }
        if (explanation.assumptions().size() > 10) {
            return ValidationResult.invalid("Explanation assumptions exceeds 10 items");
        }
        if (explanation.suggestedChecks().size() > 10) {
            return ValidationResult.invalid("Explanation suggestedChecks exceeds 10 items");
        }

        for (String a : explanation.assumptions()) {
            if (a.length() > 300) {
                return ValidationResult.invalid("Assumption item exceeds 300 characters: " + a);
            }
        }
        for (String c : explanation.suggestedChecks()) {
            if (c.length() > 300) {
                return ValidationResult.invalid("Suggested check item exceeds 300 characters: " + c);
            }
        }

        String fullText = (explanation.summary() + " " + explanation.reason()).toLowerCase();

        // 3. Reject forbidden equipment / safety actions
        if (FORBIDDEN_EMERGENCY_PATTERN.matcher(fullText).find()) {
            return ValidationResult.invalid("Explanation violates safety rule: cannot recommend disabling emergency/critical/ventilation systems");
        }

        // 4. Reject overconfident occupancy assertions (Prompt Rule 3: say 'no person detected in camera view', not 'the room is empty')
        if (OVERCONFIDENT_EMPTY_PATTERN.matcher(fullText).find()) {
            return ValidationResult.invalid("Explanation violates occupancy phrasing rule: claimed absolute emptiness rather than 'no person detected in camera view'");
        }

        // 5. Numerical claims check: LLM must not invent new metrics
        if (NUMERICAL_CLAIMS_PATTERN.matcher(explanation.summary()).find() ||
            NUMERICAL_CLAIMS_PATTERN.matcher(explanation.reason()).find()) {
            return ValidationResult.invalid("Explanation violates rule: LLM introduced numerical calculation claims; metrics are backend-owned");
        }

        // 6. Eligibility check: if room is NOT eligible (e.g. OCCUPIED), cannot recommend turning off equipment
        boolean isEligible = "ELIGIBLE".equalsIgnoreCase(context.currentEligibility());
        if (!isEligible) {
            if (fullText.contains("switch off") || fullText.contains("turn off") || fullText.contains("proceed with shutdown")) {
                return ValidationResult.invalid("Explanation contradicts current ineligibility state: recommended action while room is not ELIGIBLE");
            }
        }

        return ValidationResult.valid();
    }
}
