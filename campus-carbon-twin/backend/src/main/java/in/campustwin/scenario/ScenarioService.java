package in.campustwin.scenario;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ScenarioService {

    private final Map<String, SavedScenario> scenarios = new ConcurrentHashMap<>();

    public ScenarioService() {
        initDefaultScenarios();
    }

    private void initDefaultScenarios() {
        // Scenario 123 matches exact prompt example!
        // 8 nonessential lights, declared ON. Avoid 0.32 kWh over 2 hours. 0.22912 kg CO2.
        scenarios.put("scenario-123", new SavedScenario(
            "scenario-123",
            "ROOM-SCI-204",
            "NONESSENTIAL_LIGHTING",
            "Nonessential Lighting Deactivation",
            "Switching off 8 nonessential lights in Physics Lecture Hall 204 for 2 hours during detected vacancy.",
            "Repeated fresh zero-person observations in the camera view.",
            "NONESSENTIAL_LIGHTS",
            "HUMAN_DECLARED",
            120,
            0.32,
            0.22912,
            "Documented regional historical eGRID subregion factor",
            2024,
            0.716,
            "kg CO2e / kWh",
            "SIMULATED",
            Instant.parse("2026-10-16T07:10:00Z"),
            List.of(
                "Entered rated power (160 W total for 8 banks) is representative of consumption.",
                "Selected equipment remains off for the proposed 120-minute duration.",
                "Human inspection verifies space is unused prior to action."
            ),
            List.of(
                "Disable emergency lighting",
                "Disable critical equipment",
                "Reduce required ventilation",
                "Automatically switch equipment"
            )
        ));

        // Scenario 124: Alternative HVAC setback scenario for comparison
        scenarios.put("scenario-124", new SavedScenario(
            "scenario-124",
            "ROOM-SCI-204",
            "HVAC_SETBACK",
            "Eco-Mode HVAC Setback",
            "Increase cooling setpoint by +2.5°C and reduce VAV fan speed to 30% for 2 hours.",
            "Repeated fresh zero-person observations in the camera view.",
            "HVAC_AIR_HANDLER",
            "HUMAN_DECLARED",
            120,
            2.60,
            1.8616,
            "Documented regional historical eGRID subregion factor",
            2024,
            0.716,
            "kg CO2e / kWh",
            "SIMULATED",
            Instant.parse("2026-10-16T07:15:00Z"),
            List.of(
                "VAV air handler setpoint adjustment reduces power by 1.3 kW.",
                "Room thermal drift remains within safe unoccupied envelope.",
                "Human inspection confirms zero occupancy prior to setback."
            ),
            List.of(
                "Disable emergency lighting",
                "Disable critical equipment",
                "Reduce required ventilation below minimum code",
                "Automatically switch equipment"
            )
        ));

        // Scenario 125: Scenario in an occupied room (ROOM-ENG-220) to demonstrate ineligibility
        scenarios.put("scenario-125", new SavedScenario(
            "scenario-125",
            "ROOM-ENG-220",
            "WORKSTATION_IDLE",
            "Lab Workstation Power-Down",
            "Transition 30 CAD workstations to low-power sleep state for 1 hour.",
            "Camera view reports active occupants present in lab space.",
            "COMPUTING_WORKSTATIONS",
            "HUMAN_DECLARED",
            60,
            1.85,
            1.3246,
            "Documented regional historical eGRID subregion factor",
            2024,
            0.716,
            "kg CO2e / kWh",
            "SIMULATED",
            Instant.parse("2026-10-16T07:20:00Z"),
            List.of(
                "Idle workstation draw is 60W per workstation.",
                "Workstations must not be in active student use."
            ),
            List.of(
                "Interrupt active user sessions without confirmation",
                "Power down network storage or server hardware",
                "Automatically switch equipment"
            )
        ));
    }

    public Optional<SavedScenario> findById(String id) {
        return Optional.ofNullable(scenarios.get(id));
    }

    public List<SavedScenario> listScenarios() {
        return new ArrayList<>(scenarios.values());
    }

    public SavedScenario save(SavedScenario scenario) {
        scenarios.put(scenario.id(), scenario);
        return scenario;
    }
}
