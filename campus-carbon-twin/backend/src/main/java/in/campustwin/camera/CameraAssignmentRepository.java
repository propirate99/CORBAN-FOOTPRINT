package in.campustwin.camera;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CameraAssignmentRepository extends JpaRepository<CameraAssignment, UUID> {
    Optional<CameraAssignment> findByUserIdAndRoomIdAndIsActiveTrue(UUID userId, String roomId);
    List<CameraAssignment> findByUserIdAndIsActiveTrue(UUID userId);
    boolean existsByUserIdAndRoomIdAndIsActiveTrue(UUID userId, String roomId);
}
