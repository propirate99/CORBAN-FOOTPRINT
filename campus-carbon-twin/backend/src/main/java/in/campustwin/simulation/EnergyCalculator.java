package in.campustwin.simulation;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EnergyCalculator {

    public record EquipmentLoad(double activeWatts, double standbyWatts, boolean isActive) {}

    public double calculateTotalPowerKw(List<EquipmentLoad> equipment) {
        double totalWatts = equipment.stream()
            .mapToDouble(e -> e.isActive() ? e.activeWatts() : e.standbyWatts())
            .sum();
        return totalWatts / 1000.0;
    }

    public double calculateHourlyCarbonKg(double powerKw, double gridFactorKgPerKwh) {
        return powerKw * gridFactorKgPerKwh;
    }
}
