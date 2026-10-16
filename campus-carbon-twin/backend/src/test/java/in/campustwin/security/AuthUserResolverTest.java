package in.campustwin.security;

import in.campustwin.campus.CampusMembership;
import in.campustwin.campus.CampusMembershipRepository;
import in.campustwin.camera.CameraAssignmentRepository;
import in.campustwin.room.RoomEntity;
import in.campustwin.room.RoomRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class AuthUserResolverTest {

    private CampusMembershipRepository membershipRepository;
    private CameraAssignmentRepository cameraAssignmentRepository;
    private RoomRepository roomRepository;
    private AuthUserResolver authUserResolver;

    private final UUID testUserId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID testCampusId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID foreignCampusId = UUID.fromString("99999999-9999-9999-9999-999999999999");
    private final String testRoomId = "ROOM-SCI-204";

    @BeforeEach
    void setUp() {
        membershipRepository = mock(CampusMembershipRepository.class);
        cameraAssignmentRepository = mock(CameraAssignmentRepository.class);
        roomRepository = mock(RoomRepository.class);
        authUserResolver = new AuthUserResolver(membershipRepository, cameraAssignmentRepository, roomRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuthenticatedUser(UUID userId) {
        Jwt jwt = new Jwt(
            "mock-token",
            Instant.now(),
            Instant.now().plusSeconds(3600),
            Map.of("alg", "none"),
            Map.of("sub", userId.toString(), "aud", "authenticated")
        );
        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testAnonymousDenialThrowsUnauthorized() {
        // No SecurityContext set (anonymous visitor)
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authUserResolver.getVerifiedUserId();
        });
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void testCrossCampusIsolationDenied() {
        mockAuthenticatedUser(testUserId);
        when(membershipRepository.findByCampusIdAndUserId(foreignCampusId, testUserId))
            .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authUserResolver.getCampusMembership(foreignCampusId);
        });
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertNotNull(ex.getReason());
        assertTrue(ex.getReason().contains("Cross-campus isolation"));
    }

    @Test
    void testOperatorRoomAssignmentEnforcementDeniedWhenNoAssignment() {
        mockAuthenticatedUser(testUserId);

        RoomEntity room = new RoomEntity(testRoomId, testCampusId, "BLDG-SCI", "Physics Hall", 2, 100);
        when(roomRepository.findById(testRoomId)).thenReturn(Optional.of(room));

        CampusMembership membership = new CampusMembership(UUID.randomUUID(), testCampusId, testUserId, "OPERATOR");
        when(membershipRepository.findByCampusIdAndUserId(testCampusId, testUserId)).thenReturn(Optional.of(membership));

        // No active camera assignment in DB
        when(cameraAssignmentRepository.findByUserIdAndRoomIdAndIsActiveTrue(testUserId, testRoomId))
            .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authUserResolver.requireActiveCameraAssignment(testRoomId);
        });
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertNotNull(ex.getReason());
        assertTrue(ex.getReason().contains("Camera assignment enforcement"));
    }

    @Test
    void testManagerCampusEnforcementRejectsViewerOrOperator() {
        mockAuthenticatedUser(testUserId);

        CampusMembership viewerMembership = new CampusMembership(UUID.randomUUID(), testCampusId, testUserId, "VIEWER");
        when(membershipRepository.findByCampusIdAndUserId(testCampusId, testUserId)).thenReturn(Optional.of(viewerMembership));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authUserResolver.requireCampusRole(testCampusId, "MANAGER");
        });
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertNotNull(ex.getReason());
        assertTrue(ex.getReason().contains("Role enforcement"));
    }

    @Test
    void testManagerRoleGrantedForManagerUser() {
        mockAuthenticatedUser(testUserId);

        CampusMembership managerMembership = new CampusMembership(UUID.randomUUID(), testCampusId, testUserId, "MANAGER");
        when(membershipRepository.findByCampusIdAndUserId(testCampusId, testUserId)).thenReturn(Optional.of(managerMembership));

        CampusMembership resolved = authUserResolver.requireCampusRole(testCampusId, "MANAGER");
        assertNotNull(resolved);
        assertEquals("MANAGER", resolved.getRole());
    }
}
