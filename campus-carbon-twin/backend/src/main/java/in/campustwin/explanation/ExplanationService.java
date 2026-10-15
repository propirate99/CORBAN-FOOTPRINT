package in.campustwin.explanation;

public interface ExplanationService {
    String generateExplanation(String roomName, String actionTitle, double co2eSavedKg, int occupants);
}
