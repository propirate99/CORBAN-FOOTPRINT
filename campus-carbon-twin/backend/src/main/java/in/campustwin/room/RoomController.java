package in.campustwin.room;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomStateService roomStateService;

    public RoomController(RoomStateService roomStateService) {
        this.roomStateService = roomStateService;
    }

    @GetMapping
    public List<Map<String, Object>> listRooms(@RequestParam(required = false) String buildingId) {
        return roomStateService.listRooms().stream()
            .map(r -> Map.<String, Object>of(
                "id", r.id(),
                "name", r.name(),
                "buildingId", r.buildingId(),
                "capacity", r.capacity(),
                "currentOccupancy", r.currentOccupancy(),
                "status", r.status(),
                "powerDrawKw", r.powerDrawKw(),
                "emissionRateKgCo2ePerHour", r.emissionRateKgCo2ePerHour(),
                "confidenceScore", r.confidenceScore()
            ))
            .toList();
    }

    @GetMapping("/{roomId}")
    public Map<String, Object> getRoomDetail(@PathVariable String roomId) {
        var room = roomStateService.getRoom(roomId).orElseGet(() ->
            new RoomStateService.RoomState(
                roomId, "Room " + roomId, "BLDG-SCI", 100, 0, "OPTIMAL", 2.0, 0.85,
                java.time.Instant.now(), 0.9, List.of()
            )
        );
        return Map.of(
            "id", room.id(),
            "name", room.name(),
            "buildingId", room.buildingId(),
            "capacity", room.capacity(),
            "currentOccupancy", room.currentOccupancy(),
            "status", room.status(),
            "powerDrawKw", room.powerDrawKw(),
            "emissionRateKgCo2ePerHour", room.emissionRateKgCo2ePerHour(),
            "equipment", room.equipment()
        );
    }
}
