package in.campustwin.observation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
public class ObservationController {

    @PostMapping("/api/v1/rooms/{roomId}/observations")
    public ResponseEntity<Map<String, Object>> ingestRoomObservation(
            @PathVariable String roomId,
            @RequestBody Map<String, Object> payload) {
        String observationId = (String) payload.getOrDefault("observationId", UUID.randomUUID().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "observationId", observationId,
            "roomId", roomId,
            "receivedAt", Instant.now().toString()
        ));
    }

    @PostMapping("/api/v1/observations")
    public ResponseEntity<Map<String, Object>> ingestObservation(@RequestBody Map<String, Object> payload) {
        String roomId = (String) payload.getOrDefault("roomId", "UNKNOWN");
        int count = ((Number) payload.getOrDefault("peopleDetected", payload.getOrDefault("personCount", 0))).intValue();
        double confidence = ((Number) payload.getOrDefault("confidenceScore", 0.9)).doubleValue();
        String observationId = (String) payload.getOrDefault("observationId", UUID.randomUUID().toString());

        boolean isWaste = (count == 0);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "observationId", observationId,
            "id", observationId,
            "roomId", roomId,
            "personCount", count,
            "confidenceScore", confidence,
            "wasteDetected", isWaste,
            "receivedAt", Instant.now().toString(),
            "loggedAt", Instant.now().toString()
        ));
    }
}

