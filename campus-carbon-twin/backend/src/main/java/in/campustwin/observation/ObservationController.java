package in.campustwin.observation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/observations")
public class ObservationController {

    @PostMapping
    public ResponseEntity<Map<String, Object>> ingestObservation(@RequestBody Map<String, Object> payload) {
        String roomId = (String) payload.getOrDefault("roomId", "UNKNOWN");
        int count = ((Number) payload.getOrDefault("personCount", 0)).intValue();
        double confidence = ((Number) payload.getOrDefault("confidenceScore", 0.9)).doubleValue();

        boolean isWaste = (count == 0);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", UUID.randomUUID().toString(),
            "roomId", roomId,
            "personCount", count,
            "confidenceScore", confidence,
            "wasteDetected", isWaste,
            "loggedAt", Instant.now().toString()
        ));
    }
}
