package in.campustwin.observation;

import in.campustwin.room.RoomEntity;
import in.campustwin.room.RoomRepository;
import in.campustwin.security.AuthUserResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
public class ObservationController {

    private static final Logger log = LoggerFactory.getLogger(ObservationController.class);

    private final AuthUserResolver authUserResolver;
    private final ObservationRepository observationRepository;
    private final RoomRepository roomRepository;

    public ObservationController(AuthUserResolver authUserResolver,
                                 ObservationRepository observationRepository,
                                 RoomRepository roomRepository) {
        this.authUserResolver = authUserResolver;
        this.observationRepository = observationRepository;
        this.roomRepository = roomRepository;
    }

    @PostMapping("/api/v1/rooms/{roomId}/observations")
    public ResponseEntity<Map<String, Object>> ingestRoomObservation(
            @PathVariable String roomId,
            @RequestHeader(value = "X-Session-ID", required = false) String headerSessionId,
            @RequestBody Map<String, Object> payload) {

        return processObservation(roomId, headerSessionId, payload);
    }

    @PostMapping("/api/v1/observations")
    public ResponseEntity<Map<String, Object>> ingestObservation(
            @RequestHeader(value = "X-Session-ID", required = false) String headerSessionId,
            @RequestBody Map<String, Object> payload) {

        String roomId = (String) payload.get("roomId");
        if (roomId == null || roomId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roomId is required in payload");
        }
        return processObservation(roomId, headerSessionId, payload);
    }

    private ResponseEntity<Map<String, Object>> processObservation(
            String roomId,
            String headerSessionId,
            Map<String, Object> payload) {

        // 1. Enforce verified authenticated user, OPERATOR role for room's campus,
        // and active camera_assignments row for that user and room.
        authUserResolver.requireActiveCameraAssignment(roomId);

        // 2. Enforce valid active session
        String sessionId = headerSessionId != null && !headerSessionId.isBlank()
            ? headerSessionId
            : (String) payload.get("sessionId");

        if (sessionId == null || sessionId.trim().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid active session ID is required");
        }

        // 3. Extract and validate observation values
        int count = ((Number) payload.getOrDefault("peopleDetected", payload.getOrDefault("personCount", 0))).intValue();
        if (count < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "personCount cannot be negative");
        }

        double confidence = ((Number) payload.getOrDefault("confidenceScore", 0.9)).doubleValue();
        if (confidence < 0.0 || confidence > 1.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "confidenceScore must be between 0.0 and 1.0");
        }

        String rawObservedAt = (String) payload.get("observedAt");
        Instant observedAt;
        if (rawObservedAt != null && !rawObservedAt.isBlank()) {
            try {
                observedAt = Instant.parse(rawObservedAt);
            } catch (DateTimeParseException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ISO-8601 observedAt timestamp format");
            }
        } else {
            observedAt = Instant.now();
        }

        // 4. Duplicate rejection: same room, session, and observed_at
        if (observationRepository.existsByRoomIdAndSessionIdAndObservedAt(roomId, sessionId, observedAt)) {
            log.warn("Duplicate observation rejected for room={} session={}", roomId, sessionId);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate observation rejected: observation already recorded for this room, session, and timestamp");
        }

        // 5. Stale observation handling: check if an older count would overwrite newer room state
        Optional<ObservationEntity> latestExisting = observationRepository.findTopByRoomIdOrderByObservedAtDesc(roomId);
        boolean isStale = latestExisting.isPresent() && observedAt.isBefore(latestExisting.get().getObservedAt());

        String observationId = (String) payload.getOrDefault("observationId", "OBS-" + UUID.randomUUID().toString());
        String deviceId = (String) payload.getOrDefault("deviceId", "edge-cam-" + roomId);

        ObservationEntity observation = new ObservationEntity(
            observationId,
            roomId,
            count,
            confidence,
            deviceId,
            sessionId,
            observedAt
        );
        observationRepository.save(observation);

        boolean roomUpdated = false;
        if (!isStale) {
            // Update room current occupancy and status only when the observation is fresh
            RoomEntity room = authUserResolver.getVerifiedRoom(roomId);
            room.setCurrentOccupancy(count);
            room.setStatus(count == 0 ? "WASTEFUL" : "IN_USE");
            roomRepository.save(room);
            roomUpdated = true;
        } else {
            log.warn("Stale observation received for room={} at {}. Preserving newer room state.", roomId, observedAt);
        }

        // Zero-PII, zero-secret logging
        log.info("Ingested observation id={} room={} count={} confidence={} stale={} roomUpdated={}",
            observationId, roomId, count, confidence, isStale, roomUpdated);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "observationId", observationId,
            "roomId", roomId,
            "personCount", count,
            "confidenceScore", confidence,
            "staleObservation", isStale,
            "roomStateUpdated", roomUpdated,
            "receivedAt", Instant.now().toString()
        ));
    }
}
