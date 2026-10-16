package in.campustwin.action;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActionRepository extends JpaRepository<ActionEntity, String> {
    List<ActionEntity> findByCampusId(UUID campusId);
    List<ActionEntity> findByRoomId(String roomId);
}
