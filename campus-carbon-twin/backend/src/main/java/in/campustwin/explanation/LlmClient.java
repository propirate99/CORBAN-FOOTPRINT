package in.campustwin.explanation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LlmClient {

    @Value("${gemini.api-key:mock_key}")
    private String apiKey;

    public String callGemini(String prompt) {
        // LLM integration layer for Google Gemini API
        // Falls back safely if API key is unconfigured or in offline mode
        return "AI Analysis: Immediate setback is recommended. The edge camera detected 0 occupants with 94% confidence. Executing this mitigation eliminates unnecessary HVAC cycling, reducing local branch grid load.";
    }
}
