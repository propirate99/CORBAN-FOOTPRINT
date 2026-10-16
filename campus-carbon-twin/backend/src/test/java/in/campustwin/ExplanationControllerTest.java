package in.campustwin;

import in.campustwin.explanation.ExplanationController;
import in.campustwin.explanation.ExplanationResponse;
import in.campustwin.explanation.ExplanationService;
import in.campustwin.room.RoomStateService;
import in.campustwin.scenario.SavedScenario;
import in.campustwin.scenario.ScenarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ExplanationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ScenarioService scenarioService;

    @Autowired
    private RoomStateService roomStateService;

    @Test
    void testGetExplanationEndpointReturnsStructuredResponse() throws Exception {
        mockMvc.perform(post("/api/v1/scenarios/scenario-123/explanation")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenarioId").value("scenario-123"))
                .andExpect(jsonPath("$.roomId").value("ROOM-SCI-204"))
                .andExpect(jsonPath("$.source").value("TEMPLATE")) // Since mock key / no live key in test
                .andExpect(jsonPath("$.metrics.estimatedAvoidedKwh").value(0.32))
                .andExpect(jsonPath("$.metrics.estimatedAvoidedKgCo2").value(0.22912))
                .andExpect(jsonPath("$.evidenceLevel").value("SIMULATED"))
                .andExpect(jsonPath("$.currentEligibility").value("ELIGIBLE"))
                .andExpect(jsonPath("$.explanation.summary").isNotEmpty())
                .andExpect(jsonPath("$.explanation.reason").isNotEmpty())
                .andExpect(jsonPath("$.explanation.assumptions").isArray())
                .andExpect(jsonPath("$.explanation.suggestedChecks").isArray())
                .andExpect(jsonPath("$.mandatorySafetyChecks").isArray())
                .andExpect(jsonPath("$.limitations").isArray())
                .andExpect(jsonPath("$.actionPermission").value("HUMAN_APPROVAL_REQUIRED"));
    }

    @Test
    void testUnknownScenarioReturns404() throws Exception {
        mockMvc.perform(post("/api/v1/scenarios/non-existent-scenario/explanation")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void testListScenariosReturnsSeededScenarios() throws Exception {
        mockMvc.perform(get("/api/v1/scenarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.id == 'scenario-123')]").exists());
    }

    @Test
    void testCompareScenariosReturnsDifferences() throws Exception {
        mockMvc.perform(post("/api/v1/scenarios/scenario-123/compare?alternativeId=scenario-124"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenarioA.id").value("scenario-123"))
                .andExpect(jsonPath("$.scenarioB.id").value("scenario-124"))
                .andExpect(jsonPath("$.comparisonExplanation.summary").isNotEmpty())
                .andExpect(jsonPath("$.comparisonExplanation.reason").isNotEmpty());
    }

    @Test
    void testOccupancyOverrideTriggersImmediateIneligibleExplanation() throws Exception {
        // 1. Simulate occupancy change to 3 people
        mockMvc.perform(post("/api/v1/scenarios/scenario-123/occupancy-override")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"occupancy\": 3, \"stale\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newOccupancy").value(3));

        // 2. Request explanation: must now be INELIGIBLE_OCCUPIED
        mockMvc.perform(post("/api/v1/scenarios/scenario-123/explanation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentEligibility").value("INELIGIBLE_OCCUPIED"))
                .andExpect(jsonPath("$.explanation.summary").value(org.hamcrest.Matchers.containsString("current conditions do not support an occupancy-based action")));

        // 3. Reset occupancy back to 0
        mockMvc.perform(post("/api/v1/scenarios/scenario-123/occupancy-override")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"occupancy\": 0, \"stale\": false}"))
                .andExpect(status().isOk());

        // 4. Request explanation: must now be ELIGIBLE again
        mockMvc.perform(post("/api/v1/scenarios/scenario-123/explanation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentEligibility").value("ELIGIBLE"));
    }
}
