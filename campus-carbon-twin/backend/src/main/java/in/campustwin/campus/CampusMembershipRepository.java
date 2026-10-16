package in.campustwin.campus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampusMembershipRepository extends JpaRepository<CampusMembership, UUID> {
    Optional<CampusMembership> findByCampusIdAndUserId(UUID campusId, UUID userId);
    List<CampusMembership> findByUserId(UUID userId);
    boolean existsByCampusIdAndUserId(UUID campusId, UUID userId);
}
