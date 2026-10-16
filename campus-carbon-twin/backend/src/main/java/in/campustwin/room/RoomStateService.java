package in.campustwin.room;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomStateService {

    public record RoomState(
        String id,
        String name,
        String buildingId,
        int capacity,
        int currentOccupancy,
        String status,
        double powerDrawKw,
        double emissionRateKgCo2ePerHour,
        Instant lastObservationAt,
        double confidenceScore,
        List<Map<String, Object>> equipment
    ) {}

    private final Map<String, RoomState> rooms = new ConcurrentHashMap<>();

    public RoomStateService() {
        initDefaultRooms();
    }

    private void initDefaultRooms() {
        rooms.put("ROOM-SCI-204", new RoomState(
            "ROOM-SCI-204",
            "Physics Lecture Hall 204",
            "BLDG-SCI",
            120,
            0,
            "WASTEFUL",
            4.82,
            2.06,
            Instant.now(),
            0.94,
            List.of(
                Map.of("id", "EQ-1", "name", "Air Handler Unit 204 (VAV)", "type", "HVAC", "isActive", true, "wattageWatts", 3800.0, "nonessential", false),
                Map.of("id", "EQ-2", "name", "Ceiling Lighting Grid (8 Banks)", "type", "LIGHTING", "isActive", true, "wattageWatts", 160.0, "nonessential", true),
                Map.of("id", "EQ-3", "name", "Emergency Exit Signs", "type", "EMERGENCY_LIGHTING", "isActive", true, "wattageWatts", 40.0, "safetyExclusion", true)
            )
        ));

        rooms.put("ROOM-ENG-220", new RoomState(
            "ROOM-ENG-220",
            "Computer Architecture Lab",
            "BLDG-ENG",
            60,
            42,
            "IN_USE",
            6.40,
            2.74,
            Instant.now(),
            0.98,
            List.of(
                Map.of("id", "EQ-4", "name", "Lab HVAC Zone B", "type", "HVAC", "isActive", true, "wattageWatts", 4200.0, "nonessential", false),
                Map.of("id", "EQ-5", "name", "CAD Workstation Bank (30 units)", "type", "COMPUTING", "isActive", true, "wattageWatts", 2200.0, "nonessential", true)
            )
        ));
    }

    public Optional<RoomState> getRoom(String roomId) {
        return Optional.ofNullable(rooms.get(roomId));
    }

    public List<RoomState> listRooms() {
        return new ArrayList<>(rooms.values());
    }

    public RoomState updateOccupancy(String roomId, int count, double confidence) {
        RoomState existing = rooms.get(roomId);
        if (existing == null) {
            existing = new RoomState(
                roomId,
                "Room " + roomId,
                "BLDG-DEFAULT",
                50,
                count,
                count == 0 ? "OPTIMAL" : "IN_USE",
                2.0,
                0.85,
                Instant.now(),
                confidence,
                List.of()
            );
        }

        String newStatus;
        if (count == 0) {
            newStatus = existing.powerDrawKw() > 1.5 ? "WASTEFUL" : "OPTIMAL";
        } else {
            newStatus = "IN_USE";
        }

        RoomState updated = new RoomState(
            existing.id(),
            existing.name(),
            existing.buildingId(),
            existing.capacity(),
            count,
            newStatus,
            existing.powerDrawKw(),
            existing.emissionRateKgCo2ePerHour(),
            Instant.now(),
            confidence,
            existing.equipment()
        );
        rooms.put(roomId, updated);
        return updated;
    }

    public RoomState setObservationStale(String roomId, boolean stale) {
        RoomState existing = rooms.get(roomId);
        if (existing == null) return null;
        Instant obsTime = stale ? Instant.now().minusSeconds(3600) : Instant.now();
        RoomState updated = new RoomState(
            existing.id(),
            existing.name(),
            existing.buildingId(),
            existing.capacity(),
            existing.currentOccupancy(),
            stale ? "OFFLINE" : existing.status(),
            existing.powerDrawKw(),
            existing.emissionRateKgCo2ePerHour(),
            obsTime,
            existing.confidenceScore(),
            existing.equipment()
        );
        rooms.put(roomId, updated);
        return updated;
    }
}
