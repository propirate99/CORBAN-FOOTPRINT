package in.campustwin.simulation;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/simulation")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/run")
    public Map<String, Object> runSimulation(@RequestBody Map<String, Object> params) {
        double tempDelta = ((Number) params.getOrDefault("hvacTempDeltaCelsius", 2.0)).doubleValue();
        boolean autoShutoff = (Boolean) params.getOrDefault("autoShutoffEmptyRooms", true);
        double solarKw = ((Number) params.getOrDefault("solarCapacityKw", 100.0)).doubleValue();

        return simulationService.executeScenario(tempDelta, autoShutoff, solarKw);
    }
}
