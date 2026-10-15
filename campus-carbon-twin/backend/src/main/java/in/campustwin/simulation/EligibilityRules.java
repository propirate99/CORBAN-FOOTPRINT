package in.campustwin.simulation;

import org.springframework.stereotype.Component;

@Component
public class EligibilityRules {

    public boolean isWastefulState(int occupantCount, double activePowerKw, int vacantMinutesThreshold) {
        // If 0 occupants and drawing high active power (> 1.5 kW), mark as waste
        return occupantCount == 0 && activePowerKw > 1.5;
    }

    public boolean requiresSetback(int occupantCount, boolean hvacActive) {
        return occupantCount == 0 && hvacActive;
    }
}
