package in.campustwin;

import in.campustwin.simulation.EnergyCalculator;
import in.campustwin.simulation.EnergyCalculator.EquipmentLoad;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EnergyCalculatorTest {

    private final EnergyCalculator calculator = new EnergyCalculator();

    @Test
    void testPowerSummationAcrossEquipment() {
        List<EquipmentLoad> loads = List.of(
            new EquipmentLoad(3500, 150, true),   // active: 3500W
            new EquipmentLoad(500, 10, true),     // active: 500W
            new EquipmentLoad(1000, 50, false)    // standby: 50W
        );

        double totalKw = calculator.calculateTotalPowerKw(loads);
        // (3500 + 500 + 50) / 1000 = 4.05 kW
        assertEquals(4.05, totalKw, 0.001);
    }

    @Test
    void testHourlyCarbonCalculation() {
        double powerKw = 4.0;
        double gridFactor = 0.428; // kg/kWh
        double carbonKg = calculator.calculateHourlyCarbonKg(powerKw, gridFactor);

        assertEquals(1.712, carbonKg, 0.001);
    }
}
