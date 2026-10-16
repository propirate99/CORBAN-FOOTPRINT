package in.campustwin.explanation;

import java.util.Map;

public interface ExplanationService {

    default ExplanationResponse explainScenario(String scenarioId) {
        throw new UnsupportedOperationException();
    }

    default Map<String, Object> compareAlternatives(String scenarioIdA, String scenarioIdB) {
        throw new UnsupportedOperationException();
    }

    String generateExplanation(String roomName, String actionTitle, double co2eSavedKg, int occupants);
}
