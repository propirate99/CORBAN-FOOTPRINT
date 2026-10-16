package in.campustwin.explanation;

import in.campustwin.room.RoomStateService;
import in.campustwin.scenario.SavedScenario;
import in.campustwin.scenario.ScenarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing scenario explanation and comparison endpoints.
 *
 * Strict boundary:
 * The browser sends only scenarioId. It must not supply the "official" savings,
 * equipment power, or emission factor.
 */
@RestController
@RequestMapping("/api/v1/scenarios")
public class ExplanationController {

    private final ExplanationService explanationService;
    private final ScenarioService scenarioService;
    private final RoomStateService roomStateService;

    public ExplanationController(
            ExplanationService explanationService,
            ScenarioService scenarioService,
            RoomStateService roomStateService) {
        this.explanationService = explanationService;
        this.scenarioService = scenarioService;
        this.roomStateService = roomStateService;
    }

    @GetMapping
    public List<SavedScenario> listScenarios() {
        return scenarioService.listScenarios();
    }

    @GetMapping("/{scenarioId}")
    public ResponseEntity<SavedScenario> getScenario(@PathVariable String scenarioId) {
        return scenarioService.findById(scenarioId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Main feature: Explain a validated carbon-saving scenario.
     */
    @PostMapping("/{scenarioId}/explanation")
    public ResponseEntity<ExplanationResponse> getExplanation(@PathVariable String scenarioId) {
        try {
            ExplanationResponse response = explanationService.explainScenario(scenarioId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Optional feature: Compare already-calculated alternative scenarios.
     */
    @PostMapping("/{scenarioId}/compare")
    public ResponseEntity<Map<String, Object>> compareScenarios(
            @PathVariable String scenarioId,
            @RequestParam(defaultValue = "scenario-124") String alternativeId) {
        try {
            Map<String, Object> comparison = explanationService.compareAlternatives(scenarioId, alternativeId);
            return ResponseEntity.ok(comparison);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Demonstration helper: simulate occupancy change for a scenario's room
     * to prove live that a changed room condition immediately makes the scenario INELIGIBLE.
     */
    @PostMapping("/{scenarioId}/occupancy-override")
    public ResponseEntity<Map<String, Object>> overrideRoomOccupancy(
            @PathVariable String scenarioId,
            @RequestBody Map<String, Object> payload) {
        var scenario = scenarioService.findById(scenarioId);
        if (scenario.isEmpty()) return ResponseEntity.notFound().build();

        int occupancy = ((Number) payload.getOrDefault("occupancy", 1)).intValue();
        boolean stale = (Boolean) payload.getOrDefault("stale", false);

        if (stale) {
            roomStateService.setObservationStale(scenario.get().roomId(), true);
        } else {
            roomStateService.updateOccupancy(scenario.get().roomId(), occupancy, 0.95);
        }

        return ResponseEntity.ok(Map.of(
            "scenarioId", scenarioId,
            "roomId", scenario.get().roomId(),
            "newOccupancy", occupancy,
            "isStale", stale
        ));
    }
}
