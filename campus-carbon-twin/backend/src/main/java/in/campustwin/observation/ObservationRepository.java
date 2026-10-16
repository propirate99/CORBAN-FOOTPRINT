package in.campustwin.observation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface ObservationRepository extends JpaRepository<ObservationEntity, String> {
    boolean existsByRoomIdAndSessionIdAndObservedAt(String roomId, String sessionId, Instant observedAt);
    Optional<ObservationEntity> findTopByRoomIdOrderByObservedAtDesc(String roomId);
}
