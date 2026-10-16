package in.campustwin;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.campustwin.explanation.*;
import in.campustwin.room.RoomStateService;
import in.campustwin.scenario.SavedScenario;
import in.campustwin.scenario.ScenarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExplanationServiceTest {

    private ScenarioService scenarioService;
    private RoomStateService roomStateService;
    private ExplanationContextBuilder contextBuilder;
    private TemplateExplanationProvider templateProvider;
    private ExplanationValidator validator;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        scenarioService = new ScenarioService();
        roomStateService = new RoomStateService();
        contextBuilder = new ExplanationContextBuilder(roomStateService);
        templateProvider = new TemplateExplanationProvider();
        validator = new ExplanationValidator();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testMissingApiKeyProducesTemplateFallback() {
        GeminiExplanationProvider unconfiguredProvider = new GeminiExplanationProvider(
            false, "", "gemini-1.5-flash", 8, objectMapper
        );
        DefaultExplanationService service = new DefaultExplanationService(
            scenarioService, contextBuilder, unconfiguredProvider, templateProvider, validator
        );

        ExplanationResponse response = service.explainScenario("scenario-123");

        assertNotNull(response);
        assertEquals("TEMPLATE", response.source());
        assertNotNull(response.fallbackReason());
        assertTrue(response.fallbackReason().contains("deterministic template") || response.fallbackReason().contains("unconfigured"));
        assertEquals("scenario-123", response.scenarioId());
        assertEquals("ROOM-SCI-204", response.roomId());
        assertEquals("ELIGIBLE", response.currentEligibility());
        assertEquals(0.32, response.metrics().estimatedAvoidedKwh());
        assertEquals(0.22912, response.metrics().estimatedAvoidedKgCo2());
        assertNotNull(response.explanation().summary());
        assertNotNull(response.explanation().reason());
        assertFalse(response.mandatorySafetyChecks().isEmpty());
        assertFalse(response.limitations().isEmpty());
        assertEquals("HUMAN_APPROVAL_REQUIRED", response.actionPermission());
    }

    @Test
    void testOccupiedRoomBecomesIneligibleAndBlocksShutdown() {
        // Room SCI-204 becomes occupied with 5 people detected
        roomStateService.updateOccupancy("ROOM-SCI-204", 5, 0.96);

        GeminiExplanationProvider unconfiguredProvider = new GeminiExplanationProvider(
            false, "", "gemini-1.5-flash", 8, objectMapper
        );
        DefaultExplanationService service = new DefaultExplanationService(
            scenarioService, contextBuilder, unconfiguredProvider, templateProvider, validator
        );

        ExplanationResponse response = service.explainScenario("scenario-123");

        assertEquals("INELIGIBLE_OCCUPIED", response.currentEligibility());
        assertTrue(response.explanation().summary().contains("current conditions do not support an occupancy-based action"));
        assertTrue(response.explanation().reason().contains("OCCUPIED"));
    }

    @Test
    void testStaleObservationBecomesIneligible() {
        // Set camera observation to stale (> 30 min)
        roomStateService.setObservationStale("ROOM-SCI-204", true);

        GeminiExplanationProvider unconfiguredProvider = new GeminiExplanationProvider(
            false, "", "gemini-1.5-flash", 8, objectMapper
        );
        DefaultExplanationService service = new DefaultExplanationService(
            scenarioService, contextBuilder, unconfiguredProvider, templateProvider, validator
        );

        ExplanationResponse response = service.explainScenario("scenario-123");

        assertEquals("INELIGIBLE_STALE", response.currentEligibility());
        assertTrue(response.explanation().summary().contains("current conditions do not support an occupancy-based action"));
        assertTrue(response.explanation().reason().contains("STALE"));
    }

    @Test
    void testAuthoritativeMetricsNeverOverwrittenByProse() {
        GeminiExplanationProvider unconfiguredProvider = new GeminiExplanationProvider(
            false, "", "gemini-1.5-flash", 8, objectMapper
        );
        DefaultExplanationService service = new DefaultExplanationService(
            scenarioService, contextBuilder, unconfiguredProvider, templateProvider, validator
        );

        ExplanationResponse response = service.explainScenario("scenario-123");

        // Backend owned metrics strictly match the scenario definition: 0.32 kWh and 0.22912 kg CO2
        assertEquals(0.32, response.metrics().estimatedAvoidedKwh());
        assertEquals(0.22912, response.metrics().estimatedAvoidedKgCo2());
        assertEquals(0.716, response.factorMetadata().factorValue());
        assertEquals("SIMULATED", response.evidenceLevel());
    }

    @Test
    void testExplanationContextOmitsPIIAndFrames() {
        SavedScenario scenario = scenarioService.findById("scenario-123").orElseThrow();
        ExplanationContext context = contextBuilder.build(scenario);

        // Verify context does NOT contain any personal, raw video, or sensitive keys
        assertNotNull(context.scenarioId());
        assertNotNull(context.selectedEquipmentType());
        assertFalse(context.observationDescription().contains("student"));
        assertFalse(context.observationDescription().contains("face"));
        assertFalse(context.observationDescription().contains("video"));
        assertTrue(context.forbiddenActions().contains("Disable emergency lighting"));
        assertTrue(context.forbiddenActions().contains("Disable critical equipment"));
    }

    @Test
    void testCompareAlternativesExplainsCalculatedDifferencesWithoutRecalculation() {
        GeminiExplanationProvider unconfiguredProvider = new GeminiExplanationProvider(
            false, "", "gemini-1.5-flash", 8, objectMapper
        );
        DefaultExplanationService service = new DefaultExplanationService(
            scenarioService, contextBuilder, unconfiguredProvider, templateProvider, validator
        );

        var comparison = service.compareAlternatives("scenario-123", "scenario-124");

        assertNotNull(comparison);
        assertTrue(comparison.containsKey("scenarioA"));
        assertTrue(comparison.containsKey("scenarioB"));
        assertTrue(comparison.containsKey("comparisonExplanation"));
        assertEquals("HUMAN_APPROVAL_REQUIRED", comparison.get("actionPermission"));
    }
}
