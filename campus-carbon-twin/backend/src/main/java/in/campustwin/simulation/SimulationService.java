package in.campustwin.simulation;

import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class SimulationService {

    @SuppressWarnings("unused")
    private final EnergyCalculator energyCalculator;
    @SuppressWarnings("unused")
    private final EligibilityRules eligibilityRules;

    public SimulationService(EnergyCalculator energyCalculator, EligibilityRules eligibilityRules) {
        this.energyCalculator = energyCalculator;
        this.eligibilityRules = eligibilityRules;
    }

    public Map<String, Object> executeScenario(double tempDelta, boolean autoShutoff, double solarKw) {
        double baselineMonthlyKwh = 113300.0;
        double gridFactor = 0.428;
        double baselineMonthlyCo2eKg = baselineMonthlyKwh * gridFactor;

        double tempSavingsKwh = baselineMonthlyKwh * (tempDelta * 0.035);
        double shutoffSavingsKwh = autoShutoff ? baselineMonthlyKwh * 0.11 : 0.0;
        double solarMonthlyKwh = solarKw * 125.0; // ~125 kWh/kW/month

        double totalSavedKwh = Math.min(baselineMonthlyKwh * 0.5, tempSavingsKwh + shutoffSavingsKwh + solarMonthlyKwh);
        double projectedCo2eKg = (baselineMonthlyKwh - totalSavedKwh) * gridFactor;
        double reductionPct = ((baselineMonthlyCo2eKg - projectedCo2eKg) / baselineMonthlyCo2eKg) * 100.0;
        double costSavingsUsd = totalSavedKwh * 0.14; // $0.14 per kWh

        return Map.of(
            "scenarioName", "Active Campus Optimization",
            "baselineMonthlyCo2eKg", Math.round(baselineMonthlyCo2eKg),
            "projectedMonthlyCo2eKg", Math.round(projectedCo2eKg),
            "netReductionPercentage", Math.round(reductionPct * 10.0) / 10.0,
            "annualCostSavingsUsd", Math.round(costSavingsUsd * 12.0)
        );
    }
}
