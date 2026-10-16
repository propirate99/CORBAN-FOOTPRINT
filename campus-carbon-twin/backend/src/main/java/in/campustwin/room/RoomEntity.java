package in.campustwin.room;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rooms")
public class RoomEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "campus_id")
    private UUID campusId;

    @Column(name = "building_id", length = 64)
    private String buildingId;

    @Column(nullable = false)
    private String name;

    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber = 1;

    @Column(nullable = false)
    private Integer capacity = 30;

    @Column(name = "current_occupancy", nullable = false)
    private Integer currentOccupancy = 0;

    @Column(nullable = false, length = 32)
    private String status = "OPTIMAL";

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public RoomEntity() {}

    public RoomEntity(String id, UUID campusId, String buildingId, String name, Integer floorNumber, Integer capacity) {
        this.id = id;
        this.campusId = campusId;
        this.buildingId = buildingId;
        this.name = name;
        this.floorNumber = floorNumber;
        this.capacity = capacity;
        this.currentOccupancy = 0;
        this.status = "OPTIMAL";
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public UUID getCampusId() { return campusId; }
    public void setCampusId(UUID campusId) { this.campusId = campusId; }

    public String getBuildingId() { return buildingId; }
    public void setBuildingId(String buildingId) { this.buildingId = buildingId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getFloorNumber() { return floorNumber; }
    public void setFloorNumber(Integer floorNumber) { this.floorNumber = floorNumber; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public Integer getCurrentOccupancy() { return currentOccupancy; }
    public void setCurrentOccupancy(Integer currentOccupancy) { this.currentOccupancy = currentOccupancy; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
