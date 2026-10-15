package in.campustwin.campus;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/campus")
public class CampusController {

    @GetMapping
    public Map<String, Object> getCampusSummary() {
        return Map.of(
            "id", "CAMPUS-MAIN-01",
            "name", "North Metro Institute of Technology",
            "totalBuildings", 3,
            "currentPowerKw", 16.52,
            "currentHourlyEmissionsKg", 7.07,
            "activeWasteAlerts", 1,
            "gridCarbonIntensityKgPerKwh", 0.428
        );
    }
}
