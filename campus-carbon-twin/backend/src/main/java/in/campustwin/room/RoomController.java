package in.campustwin.room;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    @GetMapping
    public List<Map<String, Object>> listRooms(@RequestParam(required = false) String buildingId) {
        return List.of(
            Map.of(
                "id", "ROOM-SCI-204",
                "name", "Physics Lecture Hall 204",
                "buildingId", "BLDG-SCI",
                "capacity", 120,
                "currentOccupancy", 0,
                "status", "WASTEFUL",
                "powerDrawKw", 4.82,
                "emissionRateKgCo2ePerHour", 2.06
            ),
            Map.of(
                "id", "ROOM-ENG-220",
                "name", "Computer Architecture Lab",
                "buildingId", "BLDG-ENG",
                "capacity", 60,
                "currentOccupancy", 42,
                "status", "IN_USE",
                "powerDrawKw", 6.40,
                "emissionRateKgCo2ePerHour", 2.74
            )
        );
    }

    @GetMapping("/{roomId}")
    public Map<String, Object> getRoomDetail(@PathVariable String roomId) {
        return Map.of(
            "id", roomId,
            "name", "Physics Lecture Hall 204",
            "buildingId", "BLDG-SCI",
            "capacity", 120,
            "currentOccupancy", 0,
            "status", "WASTEFUL",
            "powerDrawKw", 4.82,
            "emissionRateKgCo2ePerHour", 2.06,
            "equipment", List.of(
                Map.of("id", "EQ-1", "name", "VAV Air Handler 204", "type", "HVAC", "isActive", true, "wattageWatts", 3800),
                Map.of("id", "EQ-2", "name", "LED Lighting Array", "type", "LIGHTING", "isActive", true, "wattageWatts", 600)
            )
        );
    }
}
