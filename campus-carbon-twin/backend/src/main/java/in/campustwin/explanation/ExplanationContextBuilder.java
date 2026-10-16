package in.campustwin.explanation;

import in.campustwin.room.RoomStateService;
import in.campustwin.scenario.SavedScenario;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Builds minimal, sanitized ExplanationContext by combining immutable saved scenario facts
 * with live room twin occupancy and observation freshness.
 */
@Component
public class ExplanationContextBuilder {

    private final RoomStateService roomStateService;

    public ExplanationContextBuilder(RoomStateService roomStateService) {
        this.roomStateService = roomStateService;
    }

    public ExplanationContext build(SavedScenario scenario) {
        var roomOpt = roomStateService.getRoom(scenario.roomId());

        int currentOccupancy = 0;
        Instant lastObservation = Instant.now();
        String observationDesc = scenario.observationDescription();

        if (roomOpt.isPresent()) {
            var room = roomOpt.get();
            currentOccupancy = room.currentOccupancy();
            lastObservation = room.lastObservationAt();
        }

        // Determine current observation freshness and eligibility
        boolean isStale = Duration.between(lastObservation, Instant.now()).toMinutes() > 30;

        String currentObservationState;
        String currentEligibility;

        if (isStale) {
            currentObservationState = "STALE";
            currentEligibility = "INELIGIBLE_STALE";
            observationDesc = "Camera observation is stale (> 30 minutes since last check).";
        } else if (currentOccupancy > 0) {
            currentObservationState = "OCCUPIED";
            currentEligibility = "INELIGIBLE_OCCUPIED";
            observationDesc = String.format("Current camera observation detected %d person(s) present.", currentOccupancy);
        } else {
            currentObservationState = "VACANCY_CANDIDATE";
            currentEligibility = "ELIGIBLE";
            observationDesc = "Repeated fresh zero-person observations in the camera view.";
        }

        List<String> assumptions = new ArrayList<>(scenario.assumptions());
        List<String> forbidden = new ArrayList<>(scenario.forbiddenActions());

        return new ExplanationContext(
            scenario.id(),
            scenario.scenarioType(),
            scenario.roomId(),
            observationDesc,
            currentObservationState,
            currentEligibility,
            scenario.selectedEquipmentType(),
            scenario.equipmentStateBasis(),
            scenario.scenarioDurationMinutes(),
            assumptions,
            forbidden
        );
    }
}
