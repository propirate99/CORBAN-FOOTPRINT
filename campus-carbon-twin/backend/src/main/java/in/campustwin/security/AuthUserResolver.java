package in.campustwin.security;

import in.campustwin.campus.CampusMembership;
import in.campustwin.campus.CampusMembershipRepository;
import in.campustwin.camera.CameraAssignment;
import in.campustwin.camera.CameraAssignmentRepository;
import in.campustwin.room.RoomEntity;
import in.campustwin.room.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Loads and verifies authorization data from the database.
 * Does not rely on unverified JWT claims or client-supplied body attributes.
 */
@Component
public class AuthUserResolver {

    private final CampusMembershipRepository membershipRepository;
    private final CameraAssignmentRepository cameraAssignmentRepository;
    private final RoomRepository roomRepository;

    public AuthUserResolver(CampusMembershipRepository membershipRepository,
                            CameraAssignmentRepository cameraAssignmentRepository,
                            RoomRepository roomRepository) {
        this.membershipRepository = membershipRepository;
        this.cameraAssignmentRepository = cameraAssignmentRepository;
        this.roomRepository = roomRepository;
    }

    /**
     * Extracts verified UUID from the validated JWT claims.
     * Never trusts userId, campusId, roomId, or role from request body.
     */
    public UUID getVerifiedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated request");
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            if (sub == null || sub.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "JWT subject claim is missing");
            }
            try {
                return UUID.fromString(sub);
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "JWT subject is not a valid UUID format");
            }
        }

        // Fallback for custom test principals
        if (principal instanceof String principalStr) {
            try {
                return UUID.fromString(principalStr);
            } catch (IllegalArgumentException ignored) {}
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication principal");
    }

    /**
     * Loads room-to-campus relationship from DB.
     */
    public RoomEntity getVerifiedRoom(String roomId) {
        if (roomId == null || roomId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room ID is required");
        }
        return roomRepository.findById(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found in database: " + roomId));
    }

    /**
     * Resolves the campus ID for a room directly from the database.
     */
    public UUID getCampusIdForRoom(String roomId) {
        RoomEntity room = getVerifiedRoom(roomId);
        if (room.getCampusId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room " + roomId + " is not mapped to any campus");
        }
        return room.getCampusId();
    }

    /**
     * Loads verified membership and role from DB for a given campus.
     */
    public CampusMembership getCampusMembership(UUID campusId) {
        UUID userId = getVerifiedUserId();
        return membershipRepository.findByCampusIdAndUserId(campusId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, 
                "Cross-campus isolation: User is not an authorized member of campus " + campusId));
    }

    /**
     * Enforces required role for campus from DB (e.g., 'OPERATOR', 'MANAGER').
     */
    public CampusMembership requireCampusRole(UUID campusId, String minimumRole) {
        CampusMembership membership = getCampusMembership(campusId);
        String role = membership.getRole();
        
        if (!isRoleSufficient(role, minimumRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                "Role enforcement: User role " + role + " is insufficient. Minimum required: " + minimumRole);
        }
        return membership;
    }

    /**
     * Enforces that current user is an OPERATOR for the room's campus
     * and has an active camera assignment for this room in camera_assignments.
     */
    public CameraAssignment requireActiveCameraAssignment(String roomId) {
        UUID userId = getVerifiedUserId();
        UUID campusId = getCampusIdForRoom(roomId);

        // 1. Must hold OPERATOR or MANAGER role for the room's campus in database
        requireCampusRole(campusId, "OPERATOR");

        // 2. Must hold an active camera assignment row for that user and room
        return cameraAssignmentRepository.findByUserIdAndRoomIdAndIsActiveTrue(userId, roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Camera assignment enforcement: User has no active camera assignment for room " + roomId));
    }

    private boolean isRoleSufficient(String actualRole, String requiredRole) {
        if (actualRole == null) return false;
        if ("MANAGER".equalsIgnoreCase(actualRole)) return true; // MANAGER has full operational privileges
        if ("OPERATOR".equalsIgnoreCase(actualRole)) {
            return "OPERATOR".equalsIgnoreCase(requiredRole) || "VIEWER".equalsIgnoreCase(requiredRole);
        }
        if ("VIEWER".equalsIgnoreCase(actualRole)) {
            return "VIEWER".equalsIgnoreCase(requiredRole);
        }
        return false;
    }
}
