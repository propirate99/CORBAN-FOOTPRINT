package in.campustwin.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<RoomEntity, String> {
    List<RoomEntity> findByCampusId(UUID campusId);
    List<RoomEntity> findByBuildingId(String buildingId);
}
