package in.campustwin.explanation;

import org.springframework.stereotype.Service;

@Service
public class TemplateExplanationService implements ExplanationService {

    @SuppressWarnings("unused")
    private final LlmClient llmClient;

    public TemplateExplanationService(LlmClient llmClient) {
        this.llmClient = llmClient;
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
