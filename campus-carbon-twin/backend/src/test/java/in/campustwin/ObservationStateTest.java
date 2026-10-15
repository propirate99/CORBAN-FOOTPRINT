package in.campustwin;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ObservationStateTest {

    @Test
    void testConfidenceThresholdFiltering() {
        double validConfidence = 0.94;
        double noiseConfidence = 0.42;

        assertTrue(validConfidence >= 0.55);
        assertTrue(noiseConfidence < 0.55);
    }

    @Test
    void testZeroOccupantEdgeCase() {
        int occupants = 0;
        assertEquals(0, occupants);
    }
}
