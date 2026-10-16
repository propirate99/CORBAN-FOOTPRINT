package in.campustwin.simulation;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "scenarios")
public class ScenarioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "campus_id", nullable = false)
    private UUID campusId;

    @Column(name = "room_id", length = 64)
    private String roomId;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "scenario_name", nullable = false)
    private String scenarioName;

    @Column(name = "hvac_temp_delta_celsius", nullable = false)
    private Double hvacTempDeltaCelsius = 2.0;

    @Column(name = "auto_shutoff_empty_rooms", nullable = false)
    private Boolean autoShutoffEmptyRooms = true;

    @Column(name = "solar_capacity_kw", nullable = false)
    private Double solarCapacityKw = 0.0;

    @Column(name = "projected_monthly_co2e_saved_kg", nullable = false)
    private Double projectedMonthlyCo2eSavedKg = 0.0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public ScenarioEntity() {}

    public ScenarioEntity(UUID id, UUID campusId, String roomId, UUID createdBy, String scenarioName,
                          Double hvacTempDeltaCelsius, Boolean autoShutoffEmptyRooms,
                          Double solarCapacityKw, Double projectedMonthlyCo2eSavedKg) {
        this.id = id;
        this.campusId = campusId;
        this.roomId = roomId;
        this.createdBy = createdBy;
        this.scenarioName = scenarioName;
        this.hvacTempDeltaCelsius = hvacTempDeltaCelsius;
        this.autoShutoffEmptyRooms = autoShutoffEmptyRooms;
        this.solarCapacityKw = solarCapacityKw;
        this.projectedMonthlyCo2eSavedKg = projectedMonthlyCo2eSavedKg;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCampusId() { return campusId; }
    public void setCampusId(UUID campusId) { this.campusId = campusId; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public String getScenarioName() { return scenarioName; }
    public void setScenarioName(String scenarioName) { this.scenarioName = scenarioName; }

    public Double getHvacTempDeltaCelsius() { return hvacTempDeltaCelsius; }
    public void setHvacTempDeltaCelsius(Double hvacTempDeltaCelsius) { this.hvacTempDeltaCelsius = hvacTempDeltaCelsius; }

    public Boolean getAutoShutoffEmptyRooms() { return autoShutoffEmptyRooms; }
    public void setAutoShutoffEmptyRooms(Boolean autoShutoffEmptyRooms) { this.autoShutoffEmptyRooms = autoShutoffEmptyRooms; }

    public Double getSolarCapacityKw() { return solarCapacityKw; }
    public void setSolarCapacityKw(Double solarCapacityKw) { this.solarCapacityKw = solarCapacityKw; }

    public Double getProjectedMonthlyCo2eSavedKg() { return projectedMonthlyCo2eSavedKg; }
    public void setProjectedMonthlyCo2eSavedKg(Double projectedMonthlyCo2eSavedKg) { this.projectedMonthlyCo2eSavedKg = projectedMonthlyCo2eSavedKg; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
