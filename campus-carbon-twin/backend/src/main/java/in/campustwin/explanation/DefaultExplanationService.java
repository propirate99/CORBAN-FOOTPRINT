package in.campustwin.explanation;

import in.campustwin.scenario.SavedScenario;
import in.campustwin.scenario.ScenarioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Default Explanation Orchestrator.
 * Enforces the strict boundary between authoritative backend facts (metrics,
 * eligibility, safety rules, limitations) and generated explanation prose.
 */
@Primary
@Service
public class DefaultExplanationService implements ExplanationService {

    private static final Logger log = LoggerFactory.getLogger(DefaultExplanationService.class);

    private final ScenarioService scenarioService;
    private final ExplanationContextBuilder contextBuilder;
    private final GeminiExplanationProvider geminiProvider;
    private final TemplateExplanationProvider templateProvider;
    private final ExplanationValidator validator;

    public DefaultExplanationService(
            ScenarioService scenarioService,
            ExplanationContextBuilder contextBuilder,
            GeminiExplanationProvider geminiProvider,
            TemplateExplanationProvider templateProvider,
            ExplanationValidator validator) {
        this.scenarioService = scenarioService;
        this.contextBuilder = contextBuilder;
        this.geminiProvider = geminiProvider;
        this.templateProvider = templateProvider;
        this.validator = validator;
    }

    @Override
    public ExplanationResponse explainScenario(String scenarioId) {
        SavedScenario scenario = scenarioService.findById(scenarioId)
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + scenarioId));

        ExplanationContext context = contextBuilder.build(scenario);

        GeneratedExplanation explanation = null;
        String source = "TEMPLATE";
        String fallbackReason = null;

        // Step 1: Attempt GenAI if configured
        if (geminiProvider.isConfigured()) {
            try {
                GeneratedExplanation generated = geminiProvider.generate(context);
                var validation = validator.validate(generated, context);
                if (validation.isValid()) {
                    explanation = generated;
                    source = "GENAI";
                } else {
                    log.warn("GenAI explanation rejected by validator for scenario {}: {}", scenarioId, validation.reason());
                    fallbackReason = "AI explanation rejected by safety validator: " + validation.reason();
                }
            } catch (Exception e) {
                log.warn("GenAI explanation provider failed for scenario {}: {}", scenarioId, e.getMessage());
                fallbackReason = "AI service unavailable (" + (e.getMessage() != null && e.getMessage().contains("timeout") ? "8s timeout exceeded" : "provider error") + ")";
            }
        } else {
            fallbackReason = "GenAI service not enabled or API key unconfigured; using deterministic template";
        }

        // Step 2: Fallback to deterministic template if needed
        if (explanation == null) {
            explanation = templateProvider.generate(context);
            source = "TEMPLATE";
        }

        // Step 3: Assemble authoritative response (Backend owns metrics, safety checks, limitations, eligibility)
        List<String> mandatorySafetyChecks = List.of(
            "Do not affect emergency lighting or critical equipment.",
            "Do not reduce required ventilation below occupancy codes.",
            "Human confirmation and manual walk-through is required before any physical action."
        );

        List<String> limitations = List.of(
            "No person detected in camera view does not prove the entire room is empty.",
            "The result is a simulated estimate based on declared equipment wattage, not meter-verified savings."
        );

        return new ExplanationResponse(
            scenario.id(),
            scenario.roomId(),
            source,
            fallbackReason,
            Instant.now(),
            context.currentEligibility(),
            scenario.evidenceLevel(),
            new ExplanationResponse.Metrics(
                scenario.estimatedAvoidedKwh(),
                scenario.estimatedAvoidedKgCo2()
            ),
            new ExplanationResponse.FactorMetadata(
                scenario.factorSource(),
                scenario.factorReportingYear(),
                scenario.factorValue(),
                scenario.factorUnit()
            ),
            explanation,
            mandatorySafetyChecks,
            limitations,
            "HUMAN_APPROVAL_REQUIRED"
        );
    }

    @Override
    public Map<String, Object> compareAlternatives(String scenarioIdA, String scenarioIdB) {
        SavedScenario a = scenarioService.findById(scenarioIdA)
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + scenarioIdA));
        SavedScenario b = scenarioService.findById(scenarioIdB)
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + scenarioIdB));

        String diffSummary = String.format(
            "Comparing '%s' (%s) vs '%s' (%s).",
            a.title(), a.scenarioType(), b.title(), b.scenarioType()
        );

        String diffReason = String.format(
            "Scenario '%s' targets %s with %d min duration avoiding %.2f kWh (%.4f kg CO2). " +
            "Alternative '%s' targets %s avoiding %.2f kWh (%.4f kg CO2). Both utilize the same historical factor (%.3f %s).",
            a.title(), a.selectedEquipmentType(), a.scenarioDurationMinutes(), a.estimatedAvoidedKwh(), a.estimatedAvoidedKgCo2(),
            b.title(), b.selectedEquipmentType(), b.estimatedAvoidedKwh(), b.estimatedAvoidedKgCo2(),
            a.factorValue(), a.factorUnit()
        );

        List<String> tradeOffs = List.of(
            String.format("%s avoids %s whereas %s avoids %s.", a.title(), a.selectedEquipmentType(), b.title(), b.selectedEquipmentType()),
            "Neither scenario permits disabling critical or emergency equipment.",
            "Higher estimated carbon avoidance does not supersede the requirement for on-site human inspection."
        );

        return Map.of(
            "scenarioA", Map.of(
                "id", a.id(),
                "title", a.title(),
                "avoidedKwh", a.estimatedAvoidedKwh(),
                "avoidedKgCo2", a.estimatedAvoidedKgCo2()
            ),
            "scenarioB", Map.of(
                "id", b.id(),
                "title", b.title(),
                "avoidedKwh", b.estimatedAvoidedKwh(),
                "avoidedKgCo2", b.estimatedAvoidedKgCo2()
            ),
            "comparisonExplanation", Map.of(
                "summary", diffSummary,
                "reason", diffReason,
                "tradeOffs", tradeOffs
            ),
            "source", "DETERMINISTIC_COMPARISON",
            "actionPermission", "HUMAN_APPROVAL_REQUIRED"
        );
    }

    @Override
    public String generateExplanation(String roomName, String actionTitle, double co2eSavedKg, int occupants) {
        if (occupants == 0) {
            return String.format(
                "Room '%s' has 0 detected occupants. Action '%s' will save %.2f kg CO2e/h by eliminating vacant equipment draw.",
                roomName, actionTitle, co2eSavedKg
            );
        }
        return String.format("Action '%s' evaluated for '%s' with %d occupants present.", actionTitle, roomName, occupants);
    }
}
