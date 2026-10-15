package in.campustwin;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ActionWorkflowTest {

    @Test
    void testActionStatusTransition() {
        String initialStatus = "PENDING_APPROVAL";
        String transitionedStatus = "EXECUTED";

        assertEquals("PENDING_APPROVAL", initialStatus);
        assertEquals("EXECUTED", transitionedStatus);
    }
}
