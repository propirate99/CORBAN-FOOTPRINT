package in.campustwin.action;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/actions")
public class ActionController {

    @GetMapping
    public List<Map<String, Object>> getActionTimeline() {
        return List.of(
            Map.of(
                "id", "ACT-001",
                "roomId", "ROOM-SCI-204",
                "roomName", "Physics Lecture Hall 204",
                "title", "Eco-Mode HVAC Setback",
                "description", "Set temperature setback +2.5C in vacant lecture room.",
                "explanation", "Edge camera confirmed 0 occupants. Setback avoids 2.6 kW continuous waste.",
                "estimatedHourlyCo2eSavedKg", 1.12,
                "status", "PENDING_APPROVAL",
                "createdAt", Instant.now().minusSeconds(600).toString()
            )
        );
    }

    @PostMapping
    public Map<String, Object> updateAction(@RequestBody Map<String, Object> req) {
        String actionId = (String) req.get("actionId");
        String status = (String) req.getOrDefault("status", "EXECUTED");
        return Map.of(
            "id", actionId,
            "status", status,
            "updatedAt", Instant.now().toString()
        );
    }
}
