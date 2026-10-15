# Testing Checklist

## Backend Unit & Integration Tests
- [ ] `EnergyCalculatorTest`: Verifies wattage summation across varied equipment states.
- [ ] `EligibilityRulesTest`: Ensures empty rooms with running HVAC trigger waste status.
- [ ] `ObservationStateTest`: Verifies deduplication and low-confidence filtering.
- [ ] `ActionWorkflowTest`: Tests state transitions from `PENDING_APPROVAL` to `EXECUTED`.

## Edge & Camera Tests
- [ ] Camera stream initialization handles camera permission denial gracefully.
- [ ] Detector fallback correctly generates test observations when camera is absent.
- [ ] Zero-PII payload audit: Verify network traffic contains no base64 images or video streams.

## Frontend UI Tests
- [ ] `room-status.test.ts`: Confirms badge rendering matches room efficiency status.
- [ ] CampusMap renders all seed buildings with accurate alert counts.
- [ ] Scenario comparison calculator correctly reflects percentage reductions.
- [ ] Action timeline updates dynamically upon action trigger.
