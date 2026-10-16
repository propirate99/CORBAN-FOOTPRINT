package in.campustwin.action;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "actions")
public class ActionEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "room_id", length = 64)
    private String roomId;

    @Column(name = "campus_id")
    private UUID campusId;

    @Column(name = "scenario_id")
    private UUID scenarioId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "estimated_hourly_co2e_saved_kg")
    private Double estimatedHourlyCo2eSavedKg = 0.0;

    @Column(nullable = false, length = 32)
    private String status = "PENDING_APPROVAL"; // PENDING_APPROVAL, APPROVED, EXECUTED, REJECTED

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public ActionEntity() {}

    public ActionEntity(String id, String roomId, UUID campusId, String title, String description,
                        String explanation, Double estimatedHourlyCo2eSavedKg) {
        this.id = id;
        this.roomId = roomId;
        this.campusId = campusId;
        this.title = title;
        this.description = description;
        this.explanation = explanation;
        this.estimatedHourlyCo2eSavedKg = estimatedHourlyCo2eSavedKg;
        this.status = "PENDING_APPROVAL";
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public UUID getCampusId() { return campusId; }
    public void setCampusId(UUID campusId) { this.campusId = campusId; }

    public UUID getScenarioId() { return scenarioId; }
    public void setScenarioId(UUID scenarioId) { this.scenarioId = scenarioId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public Double getEstimatedHourlyCo2eSavedKg() { return estimatedHourlyCo2eSavedKg; }
    public void setEstimatedHourlyCo2eSavedKg(Double estimatedHourlyCo2eSavedKg) { this.estimatedHourlyCo2eSavedKg = estimatedHourlyCo2eSavedKg; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getApprovedBy() { return approvedBy; }
    public void setApprovedBy(UUID approvedBy) { this.approvedBy = approvedBy; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
