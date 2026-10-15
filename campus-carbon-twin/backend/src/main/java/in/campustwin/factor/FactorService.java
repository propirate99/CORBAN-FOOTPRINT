package in.campustwin.factor;

import org.springframework.stereotype.Service;

@Service
public class FactorService {
    public static final double DEFAULT_GRID_FACTOR = 0.428; // kg CO2e / kWh

    public double getEmissionFactor(String zone) {
        return DEFAULT_GRID_FACTOR;
    }
}
