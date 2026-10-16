package in.campustwin.isolatedcalculator;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/calculator")
public class CalculatorController {

    private final CalculatorService calculatorService;

    public CalculatorController(CalculatorService calculatorService) {
        this.calculatorService = calculatorService;
    }

    @PostMapping("/electricity")
    public ResponseEntity<CalculationResult> calculateElectricity(@Valid @RequestBody ElectricityRequest request) {
        return ResponseEntity.ok(calculatorService.calculateElectricity(request));
    }

    @PostMapping("/equipment")
    public ResponseEntity<CalculationResult> calculateEquipment(@Valid @RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(calculatorService.calculateEquipment(request));
    }

    @PostMapping("/travel")
    public ResponseEntity<CalculationResult> calculateTravel(@Valid @RequestBody TravelRequest request) {
        return ResponseEntity.ok(calculatorService.calculateTravel(request));
    }

    @GetMapping("/factors")
    public ResponseEntity<List<FactorDto>> getFactors() {
        return ResponseEntity.ok(FactorCatalog.getAllFactors());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "isolated-carbon-calculator",
                "timestamp", Instant.now().toString()
        ));
    }
}
