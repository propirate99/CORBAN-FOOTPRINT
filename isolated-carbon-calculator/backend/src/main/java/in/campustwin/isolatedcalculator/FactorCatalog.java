package in.campustwin.isolatedcalculator;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class FactorCatalog {

    public static final String ELECTRICITY_FACTOR_ID = "CEA_V19_FY2022_23_DEMO";
    public static final String PETROL_FACTOR_ID = "EPA_GASOLINE_TAILPIPE_REFERENCE";
    public static final String DIESEL_FACTOR_ID = "EPA_DIESEL_TAILPIPE_REFERENCE";

    public static final double LITRES_PER_US_GALLON = 3.785411784;

    private static final Map<String, FactorDto> CATALOG = new ConcurrentHashMap<>();

    static {
        CATALOG.put(ELECTRICITY_FACTOR_ID, new FactorDto(
                ELECTRICITY_FACTOR_ID,
                "India Grid Electricity Emission Factor",
                0.716,
                "kg CO2/kWh",
                "CEA CO2 Baseline Database, Version 19.0",
                "India",
                "FY 2022-23 (Historical demonstration factor)",
                "Grid generation operational direct CO2 only",
                "Historical demonstration factor; not an audited reporting recommendation or real-time marginal factor.",
                "Historical demonstration factor; not an audited reporting recommendation."
        ));

        CATALOG.put(PETROL_FACTOR_ID, new FactorDto(
                PETROL_FACTOR_ID,
                "Motor Gasoline (Petrol) Reference Factor",
                8.887 / LITRES_PER_US_GALLON,
                "kg CO2/litre",
                "US EPA GHG Emission Factors Hub (8.887 kg CO2 / US gallon)",
                "United States reference",
                "Reference standard",
                "Tailpipe CO2 only",
                "US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.",
                "US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions."
        ));

        CATALOG.put(DIESEL_FACTOR_ID, new FactorDto(
                DIESEL_FACTOR_ID,
                "Diesel Fuel Reference Factor",
                10.180 / LITRES_PER_US_GALLON,
                "kg CO2/litre",
                "US EPA GHG Emission Factors Hub (10.180 kg CO2 / US gallon)",
                "United States reference",
                "Reference standard",
                "Tailpipe CO2 only",
                "US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.",
                "US EPA reference factor; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions."
        ));
    }

    public static FactorDto getFactor(String id) {
        FactorDto factor = CATALOG.get(id);
        if (factor == null) {
            throw new IllegalArgumentException("Unknown emission factor ID: " + id);
        }
        return factor;
    }

    public static List<FactorDto> getAllFactors() {
        return List.copyOf(CATALOG.values());
    }
}
