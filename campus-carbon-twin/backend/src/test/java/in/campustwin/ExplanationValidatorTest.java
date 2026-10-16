package in.campustwin;

import in.campustwin.explanation.ExplanationContext;
import in.campustwin.explanation.ExplanationValidator;
import in.campustwin.explanation.GeneratedExplanation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExplanationValidatorTest {

    private ExplanationValidator validator;
    private ExplanationContext eligibleContext;
    private ExplanationContext occupiedContext;

    @BeforeEach
    void setUp() {
        validator = new ExplanationValidator();
        eligibleContext = new ExplanationContext(
            "scenario-123", "NONESSENTIAL_LIGHTING", "ROOM-SCI-204",
            "No person detected in camera view", "VACANCY_CANDIDATE", "ELIGIBLE",
            "NONESSENTIAL_LIGHTS", "HUMAN_DECLARED", 120,
            List.of("Equipment is rated at 160W"), List.of("Disable emergency lighting")
        );
        occupiedContext = new ExplanationContext(
            "scenario-123", "NONESSENTIAL_LIGHTING", "ROOM-SCI-204",
            "1 person detected in camera view", "OCCUPIED", "INELIGIBLE_OCCUPIED",
            "NONESSENTIAL_LIGHTS", "HUMAN_DECLARED", 120,
            List.of("Equipment is rated at 160W"), List.of("Disable emergency lighting")
        );
    }

    @Test
    void testValidExplanationPasses() {
        GeneratedExplanation valid = new GeneratedExplanation(
            "Inspect the classroom and switch off the nonessential lights if unused.",
            "No person detected in camera view during operating hours.",
            List.of("The inventory reflects selected lights.", "Duration is 2 hours."),
            List.of("Inspect areas outside camera view.", "Exclude emergency lighting.")
        );

        var result = validator.validate(valid, eligibleContext);
        assertTrue(result.isValid());
        assertNull(result.reason());
    }

    @Test
    void testRejectsNumericalInventionClaims() {
        GeneratedExplanation withNumbers = new GeneratedExplanation(
            "Switching off will save 450 kWh and reduce bills by $60.",
            "Calculated reduction of 12.5% of campus grid load.",
            List.of("Inventory is correct."),
            List.of("Check the room.")
        );

        var result = validator.validate(withNumbers, eligibleContext);
        assertFalse(result.isValid());
        assertTrue(result.reason().contains("introduced numerical calculation claims"));
    }

    @Test
    void testRejectsDisablingEmergencyLighting() {
        GeneratedExplanation dangerous = new GeneratedExplanation(
            "Disable the emergency lighting grid to maximize energy savings.",
            "No occupants detected.",
            List.of("Inventory is correct."),
            List.of("Shut down all circuits.")
        );

        var result = validator.validate(dangerous, eligibleContext);
        assertFalse(result.isValid());
        assertTrue(result.reason().contains("safety rule"));
    }

    @Test
    void testRejectsOverconfidentRoomEmptinessClaims() {
        GeneratedExplanation overconfident = new GeneratedExplanation(
            "Because the room is empty, switch off the lights immediately.",
            "Camera proves the room is empty.",
            List.of("Inventory is correct."),
            List.of("Execute shutdown.")
        );

        var result = validator.validate(overconfident, eligibleContext);
        assertFalse(result.isValid());
        assertTrue(result.reason().contains("occupancy phrasing rule"));
    }

    @Test
    void testRejectsShutdownWhenRoomIsIneligibleOccupied() {
        GeneratedExplanation shutdownWhileOccupied = new GeneratedExplanation(
            "Proceed with shutdown of lights now.",
            "Energy savings opportunity identified.",
            List.of("Equipment is on."),
            List.of("Check switch.")
        );

        var result = validator.validate(shutdownWhileOccupied, occupiedContext);
        assertFalse(result.isValid());
        assertTrue(result.reason().contains("contradicts current ineligibility state"));
    }

    @Test
    void testRejectsMissingOrEmptyFields() {
        GeneratedExplanation emptySummary = new GeneratedExplanation(
            "", "Reason text", List.of("Assumption"), List.of("Check")
        );
        var result = validator.validate(emptySummary, eligibleContext);
        assertFalse(result.isValid());
        assertTrue(result.reason().contains("missing or blank"));
    }
}
