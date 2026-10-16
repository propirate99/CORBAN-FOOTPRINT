package in.campustwin.camera;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "camera_assignments", uniqueConstraints = {
    @UniqueConstraint(name = "uq_camera_assignment_user_room", columnNames = {"user_id", "room_id"})
})
public class CameraAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "room_id", nullable = false, length = 64)
    private String roomId;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt = Instant.now();

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public CameraAssignment() {}

    public CameraAssignment(UUID id, UUID userId, String roomId, Boolean isActive) {
        this.id = id;
        this.userId = userId;
        this.roomId = roomId;
        this.isActive = isActive;
        this.assignedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
