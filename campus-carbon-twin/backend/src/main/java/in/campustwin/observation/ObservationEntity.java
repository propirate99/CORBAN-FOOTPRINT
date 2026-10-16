package in.campustwin.observation;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "observations", uniqueConstraints = {
    @UniqueConstraint(name = "uq_room_session_observed", columnNames = {"room_id", "session_id", "observed_at"})
})
public class ObservationEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "room_id", nullable = false, length = 64)
    private String roomId;

    @Column(name = "person_count", nullable = false)
    private Integer personCount = 0;

    @Column(name = "confidence_score", nullable = false)
    private Double confidenceScore = 0.0;

    @Column(name = "device_id", length = 64)
    private String deviceId;

    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "observed_at", nullable = false)
    private Instant observedAt = Instant.now();

    @Column(name = "server_received_at", nullable = false)
    private Instant serverReceivedAt = Instant.now();

    @Column(name = "logged_at")
    private Instant loggedAt = Instant.now();

    @Column(name = "source", length = 64)
    private String source = "edge_camera";

    public ObservationEntity() {}

    public ObservationEntity(String id, String roomId, Integer personCount, Double confidenceScore,
                             String deviceId, String sessionId, Instant observedAt) {
        this.id = id;
        this.roomId = roomId;
        this.personCount = personCount;
        this.confidenceScore = confidenceScore;
        this.deviceId = deviceId;
        this.sessionId = sessionId;
        this.observedAt = observedAt != null ? observedAt : Instant.now();
        this.serverReceivedAt = Instant.now();
        this.loggedAt = this.serverReceivedAt;
        this.source = "edge_camera";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public Integer getPersonCount() { return personCount; }
    public void setPersonCount(Integer personCount) { this.personCount = personCount; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public Instant getObservedAt() { return observedAt; }
    public void setObservedAt(Instant observedAt) { this.observedAt = observedAt; }

    public Instant getServerReceivedAt() { return serverReceivedAt; }
    public void setServerReceivedAt(Instant serverReceivedAt) { this.serverReceivedAt = serverReceivedAt; }

    public Instant getLoggedAt() { return loggedAt; }
    public void setLoggedAt(Instant loggedAt) { this.loggedAt = loggedAt; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
