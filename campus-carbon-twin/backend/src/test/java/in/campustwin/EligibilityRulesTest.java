package in.campustwin;

import in.campustwin.simulation.EligibilityRules;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EligibilityRulesTest {

    private final EligibilityRules rules = new EligibilityRules();

    @Test
    void testFlagWasteWhenVacantAndHighPower() {
        // 0 occupants, 4.8 kW draw, > 10 mins
        assertTrue(rules.isWastefulState(0, 4.8, 15));
    }

    @Test
    void testNoWasteWhenOccupied() {
        // 20 occupants, 4.8 kW draw
        assertFalse(rules.isWastefulState(20, 4.8, 15));
    }

    @Test
    void testNoWasteWhenVacantAndLowPower() {
        // 0 occupants, 0.3 kW standby draw
        assertFalse(rules.isWastefulState(0, 0.3, 15));
    }
}
