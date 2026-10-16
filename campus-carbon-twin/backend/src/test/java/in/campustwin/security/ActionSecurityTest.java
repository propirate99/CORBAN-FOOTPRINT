package in.campustwin.security;

import in.campustwin.action.ActionController;
import in.campustwin.action.ActionEntity;
import in.campustwin.action.ActionRepository;
import in.campustwin.campus.CampusMembership;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class ActionSecurityTest {

    private AuthUserResolver authUserResolver;
    private ActionRepository actionRepository;
    private ActionController actionController;

    private final UUID managerUserId = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private final UUID campusId = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private final String testActionId = "ACT-001";

    @BeforeEach
    void setUp() {
        authUserResolver = mock(AuthUserResolver.class);
        actionRepository = mock(ActionRepository.class);
        actionController = new ActionController(authUserResolver, actionRepository);

        when(authUserResolver.getVerifiedUserId()).thenReturn(managerUserId);
    }

    @Test
    void testNonManagerApprovalDenied() {
        ActionEntity action = new ActionEntity(
            testActionId, "ROOM-SCI-204", campusId, "Setback", "Test", "Waste", 1.2
        );
        when(actionRepository.findById(testActionId)).thenReturn(Optional.of(action));

        // When requireCampusRole is called for MANAGER, simulate 403 Forbidden
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Role enforcement: Required: MANAGER"))
            .when(authUserResolver).requireCampusRole(campusId, "MANAGER");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            actionController.approveAction(testActionId);
        });

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertNotNull(ex.getReason());
        assertTrue(ex.getReason().contains("Required: MANAGER"));
    }

    @Test
    void testInvalidStateTransitionDenied() {
        // Action is already EXECUTED
        ActionEntity executedAction = new ActionEntity(
            testActionId, "ROOM-SCI-204", campusId, "Setback", "Test", "Waste", 1.2
        );
        executedAction.setStatus("EXECUTED");
        when(actionRepository.findById(testActionId)).thenReturn(Optional.of(executedAction));

        CampusMembership managerMem = new CampusMembership(UUID.randomUUID(), campusId, managerUserId, "MANAGER");
        when(authUserResolver.requireCampusRole(campusId, "MANAGER")).thenReturn(managerMem);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            actionController.approveAction(testActionId);
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertNotNull(ex.getReason());
        assertTrue(ex.getReason().contains("expected PENDING_APPROVAL"));
    }

    @Test
    void testApprovalRecordsVerifiedApproverIdAndTimestamp() {
        ActionEntity pendingAction = new ActionEntity(
            testActionId, "ROOM-SCI-204", campusId, "Setback", "Test", "Waste", 1.2
        );
        pendingAction.setStatus("PENDING_APPROVAL");
        when(actionRepository.findById(testActionId)).thenReturn(Optional.of(pendingAction));
        when(actionRepository.save(any(ActionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CampusMembership managerMem = new CampusMembership(UUID.randomUUID(), campusId, managerUserId, "MANAGER");
        when(authUserResolver.requireCampusRole(campusId, "MANAGER")).thenReturn(managerMem);

        ResponseEntity<Map<String, Object>> response = actionController.approveAction(testActionId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("APPROVED", response.getBody().get("status"));
        assertEquals(managerUserId.toString(), response.getBody().get("approvedBy"));
        assertNotNull(pendingAction.getApprovedAt());
    }
}
