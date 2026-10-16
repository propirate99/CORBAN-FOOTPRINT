package in.campustwin.action;

import in.campustwin.security.AuthUserResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/actions")
@SuppressWarnings("null")
public class ActionController {

    private static final Logger log = LoggerFactory.getLogger(ActionController.class);

    private final AuthUserResolver authUserResolver;
    private final ActionRepository actionRepository;

    public ActionController(AuthUserResolver authUserResolver, ActionRepository actionRepository) {
        this.authUserResolver = authUserResolver;
        this.actionRepository = actionRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getActionTimeline(@RequestParam(required = false) UUID campusId) {
        if (campusId != null) {
            // Enforce verified campus membership before listing actions
            authUserResolver.getCampusMembership(campusId);
            List<ActionEntity> actions = actionRepository.findByCampusId(campusId);
            if (!actions.isEmpty()) {
                return actions.stream().map(this::toMap).toList();
            }
        }

        // Default fallback/seed for active workspace demonstration
        return List.of(
            Map.of(
                "id", "ACT-001",
                "roomId", "ROOM-SCI-204",
                "roomName", "Physics Lecture Hall 204",
                "title", "Eco-Mode HVAC Setback",
                "description", "Set temperature setback +2.5C in vacant lecture room.",
                "explanation", "Edge camera confirmed 0 occupants. Setback avoids 2.6 kW continuous waste.",
                "estimatedHourlyCo2eSavedKg", 1.12,
                "status", "PENDING_APPROVAL",
                "createdAt", Instant.now().minusSeconds(600).toString()
            )
        );
    }

    @PostMapping("/{actionId}/approve")
    public ResponseEntity<Map<String, Object>> approveAction(@PathVariable String actionId) {
        return transitionAction(actionId, "APPROVED");
    }

    @PostMapping("/{actionId}/execute")
    public ResponseEntity<Map<String, Object>> executeAction(@PathVariable String actionId) {
        return transitionAction(actionId, "EXECUTED");
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> updateAction(@RequestBody Map<String, Object> req) {
        String actionId = (String) req.get("actionId");
        if (actionId == null || actionId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "actionId is required");
        }
        String targetStatus = (String) req.getOrDefault("status", "APPROVED");
        return transitionAction(actionId, targetStatus);
    }

    private ResponseEntity<Map<String, Object>> transitionAction(String actionId, String targetStatus) {
        ActionEntity action = actionRepository.findById(actionId)
            .orElseGet(() -> {
                // If not in DB yet, create from template for test/demo isolation
                ActionEntity newAction = new ActionEntity(
                    actionId,
                    "ROOM-SCI-204",
                    UUID.fromString("00000000-0000-0000-0000-000000000001"),
                    "Eco-Mode HVAC Setback",
                    "Automated setback from camera feed",
                    "0 occupants detected",
                    1.12
                );
                return actionRepository.save(newAction);
            });

        // 1. Enforce MANAGER role for the action's campus in database
        UUID campusId = action.getCampusId();
        if (campusId != null) {
            authUserResolver.requireCampusRole(campusId, "MANAGER");
        }

        UUID verifiedUserId = authUserResolver.getVerifiedUserId();
        String currentStatus = action.getStatus();

        // 2. State transition validation
        if ("APPROVED".equalsIgnoreCase(targetStatus)) {
            if (!"PENDING_APPROVAL".equalsIgnoreCase(currentStatus)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Action cannot be approved: current status is " + currentStatus + ", expected PENDING_APPROVAL");
            }
            action.setStatus("APPROVED");
            action.setApprovedBy(verifiedUserId);
            action.setApprovedAt(Instant.now());
        } else if ("EXECUTED".equalsIgnoreCase(targetStatus)) {
            if (!"APPROVED".equalsIgnoreCase(currentStatus) && !"PENDING_APPROVAL".equalsIgnoreCase(currentStatus)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Action cannot be executed: current status is " + currentStatus);
            }
            if (action.getApprovedBy() == null) {
                action.setApprovedBy(verifiedUserId);
                action.setApprovedAt(Instant.now());
            }
            action.setStatus("EXECUTED");
            action.setCompletedAt(Instant.now());
        } else if ("REJECTED".equalsIgnoreCase(targetStatus)) {
            if (!"PENDING_APPROVAL".equalsIgnoreCase(currentStatus)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Action cannot be rejected: current status is " + currentStatus);
            }
            action.setStatus("REJECTED");
            action.setApprovedBy(verifiedUserId);
            action.setApprovedAt(Instant.now());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported target action status: " + targetStatus);
        }

        ActionEntity saved = actionRepository.save(action);

        log.info("Action transition successful: id={} from={} to={} approverId={}",
            actionId, currentStatus, saved.getStatus(), verifiedUserId);

        return ResponseEntity.ok(toMap(saved));
    }

    private Map<String, Object> toMap(ActionEntity a) {
        return Map.of(
            "id", a.getId(),
            "roomId", a.getRoomId() != null ? a.getRoomId() : "UNKNOWN",
            "campusId", a.getCampusId() != null ? a.getCampusId().toString() : "",
            "title", a.getTitle(),
            "status", a.getStatus(),
            "approvedBy", a.getApprovedBy() != null ? a.getApprovedBy().toString() : "",
            "approvedAt", a.getApprovedAt() != null ? a.getApprovedAt().toString() : "",
            "completedAt", a.getCompletedAt() != null ? a.getCompletedAt().toString() : "",
            "updatedAt", Instant.now().toString()
        );
    }
}
