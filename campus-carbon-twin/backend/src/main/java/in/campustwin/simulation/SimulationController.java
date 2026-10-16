package in.campustwin.simulation;

import in.campustwin.security.AuthUserResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/simulation")
public class SimulationController {

    private static final Logger log = LoggerFactory.getLogger(SimulationController.class);

    private final SimulationService simulationService;
    private final AuthUserResolver authUserResolver;
    private final ScenarioRepository scenarioRepository;

    public SimulationController(SimulationService simulationService,
                                AuthUserResolver authUserResolver,
                                ScenarioRepository scenarioRepository) {
        this.simulationService = simulationService;
        this.authUserResolver = authUserResolver;
        this.scenarioRepository = scenarioRepository;
    }

    @PostMapping("/run")
    public Map<String, Object> runSimulation(
            @RequestParam(required = false) UUID campusId,
            @RequestBody Map<String, Object> params) {

        // 1. Resolve target campus ID from parameter or payload
        UUID targetCampusId = campusId;
        if (targetCampusId == null && params.containsKey("campusId")) {
            try {
                targetCampusId = UUID.fromString((String) params.get("campusId"));
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid campusId UUID format in payload");
            }
        }

        if (targetCampusId == null) {
            // Default demo campus ID for sandbox environments
            targetCampusId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        }

        // 2. Enforce verified campus membership in DB before allowing calculation or creation
        authUserResolver.getCampusMembership(targetCampusId);

        UUID verifiedUserId = authUserResolver.getVerifiedUserId();

        double tempDelta = ((Number) params.getOrDefault("hvacTempDeltaCelsius", 2.0)).doubleValue();
        boolean autoShutoff = (Boolean) params.getOrDefault("autoShutoffEmptyRooms", true);
        double solarKw = ((Number) params.getOrDefault("solarCapacityKw", 100.0)).doubleValue();

        Map<String, Object> result = new HashMap<>(simulationService.executeScenario(tempDelta, autoShutoff, solarKw));

        // 3. If scenario name is provided, persist scenario linked to verified user and verified campus
        String scenarioName = (String) params.get("scenarioName");
        if (scenarioName != null && !scenarioName.isBlank()) {
            double projectedMonthlySaved = ((Number) result.getOrDefault("monthlyCo2eSavedKg", 0.0)).doubleValue();
            String roomId = (String) params.get("roomId");

            ScenarioEntity scenario = new ScenarioEntity(
                UUID.randomUUID(),
                targetCampusId,
                roomId,
                verifiedUserId,
                scenarioName,
                tempDelta,
                autoShutoff,
                solarKw,
                projectedMonthlySaved
            );
            ScenarioEntity saved = scenarioRepository.save(scenario);
            result.put("scenarioId", saved.getId().toString());
            log.info("Persisted scenario id={} campus={} user={}", saved.getId(), targetCampusId, verifiedUserId);
        }

        return result;
    }
}
