package in.campustwin.campus;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "campus_memberships", uniqueConstraints = {
    @UniqueConstraint(name = "uq_campus_membership_user", columnNames = {"campus_id", "user_id"})
})
public class CampusMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "campus_id", nullable = false)
    private UUID campusId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 32)
    private String role; // 'VIEWER', 'OPERATOR', 'MANAGER'

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public CampusMembership() {}

    public CampusMembership(UUID id, UUID campusId, UUID userId, String role) {
        this.id = id;
        this.campusId = campusId;
        this.userId = userId;
        this.role = role;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCampusId() { return campusId; }
    public void setCampusId(UUID campusId) { this.campusId = campusId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
