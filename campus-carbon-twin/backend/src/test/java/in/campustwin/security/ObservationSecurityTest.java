package in.campustwin.security;

import in.campustwin.camera.CameraAssignment;
import in.campustwin.observation.ObservationController;
import in.campustwin.observation.ObservationEntity;
import in.campustwin.observation.ObservationRepository;
import in.campustwin.room.RoomEntity;
import in.campustwin.room.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class ObservationSecurityTest {

    private AuthUserResolver authUserResolver;
    private ObservationRepository observationRepository;
    private RoomRepository roomRepository;
    private ObservationController observationController;

    private final String testRoomId = "ROOM-SCI-204";
    private final String testSessionId = "session-abc-12345";

    @BeforeEach
    void setUp() {
        authUserResolver = mock(AuthUserResolver.class);
        observationRepository = mock(ObservationRepository.class);
        roomRepository = mock(RoomRepository.class);
        observationController = new ObservationController(authUserResolver, observationRepository, roomRepository);

        CameraAssignment mockAssignment = new CameraAssignment(
            UUID.randomUUID(), UUID.randomUUID(), testRoomId, true
        );
        when(authUserResolver.requireActiveCameraAssignment(testRoomId)).thenReturn(mockAssignment);
    }

    @Test
    void testDuplicateObservationRejectedWithConflict() {
        Instant observedAt = Instant.now();
        when(observationRepository.existsByRoomIdAndSessionIdAndObservedAt(testRoomId, testSessionId, observedAt))
            .thenReturn(true);

        Map<String, Object> payload = Map.of(
            "roomId", testRoomId,
            "sessionId", testSessionId,
            "personCount", 5,
            "confidenceScore", 0.95,
            "observedAt", observedAt.toString()
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            observationController.ingestRoomObservation(testRoomId, testSessionId, payload);
        });

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertNotNull(ex.getReason());
        assertTrue(ex.getReason().contains("Duplicate observation rejected"));
    }

    @Test
    void testStaleObservationDoesNotOverwriteNewerRoomState() {
        Instant now = Instant.now();
        Instant olderTime = now.minusSeconds(120);

        // Newer observation already exists in DB
        ObservationEntity newerExisting = new ObservationEntity(
            "OBS-100", testRoomId, 10, 0.98, "cam-1", testSessionId, now
        );
        when(observationRepository.findTopByRoomIdOrderByObservedAtDesc(testRoomId))
            .thenReturn(Optional.of(newerExisting));

        when(observationRepository.existsByRoomIdAndSessionIdAndObservedAt(testRoomId, testSessionId, olderTime))
            .thenReturn(false);

        Map<String, Object> payload = Map.of(
            "roomId", testRoomId,
            "sessionId", testSessionId,
            "personCount", 0, // Out of date empty count
            "confidenceScore", 0.92,
            "observedAt", olderTime.toString()
        );

        ResponseEntity<Map<String, Object>> response =
            observationController.ingestRoomObservation(testRoomId, testSessionId, payload);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(true, response.getBody().get("staleObservation"));
        assertEquals(false, response.getBody().get("roomStateUpdated"));

        // Room entity MUST NOT have been fetched or saved with the stale count
        verify(roomRepository, never()).save(any(RoomEntity.class));
    }

    @Test
    void testFreshObservationUpdatesRoomState() {
        Instant now = Instant.now();

        when(observationRepository.findTopByRoomIdOrderByObservedAtDesc(testRoomId))
            .thenReturn(Optional.empty());

        when(observationRepository.existsByRoomIdAndSessionIdAndObservedAt(testRoomId, testSessionId, now))
            .thenReturn(false);

        RoomEntity existingRoom = new RoomEntity(testRoomId, UUID.randomUUID(), "BLDG-SCI", "Physics Hall", 2, 100);
        existingRoom.setCurrentOccupancy(0);
        existingRoom.setStatus("WASTEFUL");
        when(authUserResolver.getVerifiedRoom(testRoomId)).thenReturn(existingRoom);

        Map<String, Object> payload = Map.of(
            "roomId", testRoomId,
            "sessionId", testSessionId,
            "personCount", 25,
            "confidenceScore", 0.96,
            "observedAt", now.toString()
        );

        ResponseEntity<Map<String, Object>> response =
            observationController.ingestRoomObservation(testRoomId, testSessionId, payload);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(false, response.getBody().get("staleObservation"));
        assertEquals(true, response.getBody().get("roomStateUpdated"));

        // Verify room occupancy updated
        assertEquals(25, existingRoom.getCurrentOccupancy());
        assertEquals("IN_USE", existingRoom.getStatus());
        verify(roomRepository, times(1)).save(existingRoom);
    }
}
