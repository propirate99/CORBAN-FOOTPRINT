package in.campustwin.explanation;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Deterministic explanation provider used as reliable baseline and safety fallback.
 * Ensures the digital twin remains responsive and safe even when external LLM APIs
 * are offline, timing out, or returning unvalidated responses.
 */
@Component
public class TemplateExplanationProvider implements ExplanationProvider {

    @Override
    public String getProviderName() {
        return "TEMPLATE";
    }

    @Override
    public GeneratedExplanation generate(ExplanationContext context) {
        boolean isEligible = "ELIGIBLE".equalsIgnoreCase(context.currentEligibility());

        if (isEligible) {
            String equipmentDesc = context.selectedEquipmentType().toLowerCase().replace('_', ' ');
            String summary = String.format(
                "Inspect room %s and consider switching off the selected %s if the space is unused.",
                context.roomId(), equipmentDesc
            );
            String reason = String.format(
                "The scenario combines %s with equipment declared on. No person detected in camera view.",
                context.observationDescription().toLowerCase()
            );

            List<String> assumptions = new ArrayList<>(context.assumptions());
            if (assumptions.isEmpty()) {
                assumptions.add("The equipment inventory reflects the selected equipment.");
                assumptions.add("The proposed operating-duration reduction is achieved.");
            }

            List<String> checks = List.of(
                "Inspect the room, including areas outside the camera view.",
                "Exclude emergency lighting and critical equipment.",
                "Confirm the intended action with the responsible staff member."
            );

            return new GeneratedExplanation(summary, reason, assumptions, checks);
        } else {
            String summary = "The saved scenario is available for review, but current conditions do not support an occupancy-based action.";
            String reason = String.format(
                "Current room state is '%s' (%s). Historical scenario recommendation cannot be executed while room is occupied or observation is stale.",
                context.currentObservationState(), context.currentEligibility()
            );

            List<String> assumptions = List.of(
                "Interventions are strictly restricted to verified vacant periods.",
                "Saved calculations remain traceable for historical audits."
            );

            List<String> checks = List.of(
                "Refresh the room observation feed and reassess before proceeding.",
                "Do not power down equipment while occupants may be in space.",
                "Confirm manual inspection before taking any physical action."
            );

            return new GeneratedExplanation(summary, reason, assumptions, checks);
        }
    }
}
