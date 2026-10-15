package in.campustwin.isolatedcalculator;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class CalculatorServiceTest {

    private CalculatorService service;

    @BeforeEach
    void setUp() {
        service = new CalculatorService();
    }

    @Test
    @DisplayName("Criterion 1: 100 kWh returns 71.6 kg CO2")
    void testElectricity_100Kwh() {
        ElectricityRequest request = new ElectricityRequest(100.0);
        CalculationResult result = service.calculateElectricity(request);

        assertEquals(100.0, ((Number) result.quantities().get("kwh")).doubleValue(), 1e-6);
        assertEquals(71.6, result.estimatedKgCo2(), 1e-6);
        assertEquals("ELECTRICITY", result.activityType());
    }

    @Test
    @DisplayName("Criterion 2: 8 devices * 20 W * 2 h/day * 1 day returns 0.32 kWh and 0.22912 kg CO2")
    void testEquipment_Calculation() {
        EquipmentRequest request = new EquipmentRequest(8, 20.0, 2.0, 1);
        CalculationResult result = service.calculateEquipment(request);

        assertEquals(0.32, ((Number) result.quantities().get("estimatedKwh")).doubleValue(), 1e-6);
        assertEquals(0.22912, result.estimatedKgCo2(), 1e-6);
        assertEquals("EQUIPMENT", result.activityType());
    }

    @Test
    @DisplayName("Criterion 3: 20 km / 40 km per litre returns 0.5 L and tailpipe CO2 equals 0.5 * petrol factor")
    void testTravel_DistanceMethod() {
        TravelRequest request = new TravelRequest("PETROL", null, 20.0, 40.0, 1);
        CalculationResult result = service.calculateTravel(request);

        double expectedLitres = 0.5;
        double petrolFactor = FactorCatalog.getFactor(FactorCatalog.PETROL_FACTOR_ID).value();
        double expectedKgCo2 = expectedLitres * petrolFactor;

        assertEquals(expectedLitres, ((Number) result.quantities().get("fuelLitres")).doubleValue(), 1e-6);
        assertEquals(expectedKgCo2, result.estimatedKgCo2(), 1e-6);
        assertEquals(expectedKgCo2, result.allocatedKgCo2PerOccupant(), 1e-6);
    }

    @Test
    @DisplayName("Criterion 4: Two occupants allocates half to each occupant while total trip emissions remain unchanged")
    void testTravel_TwoOccupantsAllocation() {
        TravelRequest request = new TravelRequest("DIESEL", 10.0, null, null, 2);
        CalculationResult result = service.calculateTravel(request);

        double dieselFactor = FactorCatalog.getFactor(FactorCatalog.DIESEL_FACTOR_ID).value();
        double expectedTotalTrip = 10.0 * dieselFactor;
        double expectedPerOccupant = expectedTotalTrip / 2.0;

        assertEquals(expectedTotalTrip, result.estimatedKgCo2(), 1e-6);
        assertNotNull(result.allocatedKgCo2PerOccupant());
        assertEquals(expectedPerOccupant, result.allocatedKgCo2PerOccupant(), 1e-6);
    }

    @Test
    @DisplayName("Criterion 5: Zero kWh returns zero kg CO2")
    void testElectricity_ZeroKwh() {
        ElectricityRequest request = new ElectricityRequest(0.0);
        CalculationResult result = service.calculateElectricity(request);

        assertEquals(0.0, result.estimatedKgCo2(), 1e-9);
    }

    @Test
    @DisplayName("Criterion 6: Negative input returns exception / error")
    void testNegativeInput_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
                service.calculateElectricity(new ElectricityRequest(-50.0))
        );
        assertThrows(IllegalArgumentException.class, () ->
                service.calculateEquipment(new EquipmentRequest(1, -100.0, 5.0, 1))
        );
        assertThrows(IllegalArgumentException.class, () ->
                service.calculateTravel(new TravelRequest("PETROL", -2.0, null, null, 1))
        );
    }

    @Test
    @DisplayName("Criterion 7: Zero mileage returns exception / error")
    void testTravel_ZeroMileage_Throws() {
        TravelRequest request = new TravelRequest("PETROL", null, 50.0, 0.0, 1);
        assertThrows(IllegalArgumentException.class, () -> service.calculateTravel(request));
    }

    @Test
    @DisplayName("Criterion 8: Zero occupants returns exception / error")
    void testTravel_ZeroOccupants_Throws() {
        TravelRequest request = new TravelRequest("PETROL", 5.0, null, null, 0);
        assertThrows(IllegalArgumentException.class, () -> service.calculateTravel(request));
    }

    @Test
    @DisplayName("Criterion 9: Both travel input methods return exception / error")
    void testTravel_BothMethodsProvided_Throws() {
        TravelRequest request = new TravelRequest("PETROL", 5.0, 100.0, 20.0, 1);
        assertThrows(IllegalArgumentException.class, () -> service.calculateTravel(request));
    }

    @Test
    @DisplayName("Criterion 10: Partial travel distance input returns exception / error")
    void testTravel_PartialDistanceInput_Throws() {
        // Distance provided without mileage
        TravelRequest req1 = new TravelRequest("PETROL", null, 100.0, null, 1);
        assertThrows(IllegalArgumentException.class, () -> service.calculateTravel(req1));

        // Mileage provided without distance
        TravelRequest req2 = new TravelRequest("PETROL", null, null, 25.0, 1);
        assertThrows(IllegalArgumentException.class, () -> service.calculateTravel(req2));
    }

    @Test
    @DisplayName("Criterion 11: Missing required fields return exception / error")
    void testMissingFields_Throws() {
        assertThrows(IllegalArgumentException.class, () -> service.calculateElectricity(null));
        assertThrows(IllegalArgumentException.class, () -> service.calculateElectricity(new ElectricityRequest(null)));
        assertThrows(IllegalArgumentException.class, () -> service.calculateEquipment(null));
        assertThrows(IllegalArgumentException.class, () -> service.calculateTravel(null));
    }

    @Test
    @DisplayName("Criterion 12: Unsupported fuel type returns exception / error")
    void testTravel_UnsupportedFuelType_Throws() {
        TravelRequest request = new TravelRequest("HYDROGEN", 10.0, null, null, 1);
        assertThrows(IllegalArgumentException.class, () -> service.calculateTravel(request));
    }

    @Test
    @DisplayName("Criterion 13: More than 24 operating hours/day returns exception / error")
    void testEquipment_Exceeding24Hours_Throws() {
        EquipmentRequest request = new EquipmentRequest(2, 50.0, 25.0, 1);
        assertThrows(IllegalArgumentException.class, () -> service.calculateEquipment(request));
    }

    @Test
    @DisplayName("Criterion 14: Factor metadata is included in results")
    void testFactorMetadataIncluded() {
        CalculationResult elResult = service.calculateElectricity(new ElectricityRequest(50.0));
        assertNotNull(elResult.factorMetadata());
        assertFalse(elResult.factorMetadata().isEmpty());
        FactorDto elFactor = elResult.factorMetadata().get(0);
        assertEquals(FactorCatalog.ELECTRICITY_FACTOR_ID, elFactor.id());
        assertEquals("CEA CO2 Baseline Database, Version 19.0", elFactor.sourceName());
        assertEquals("India", elFactor.geography());

        CalculationResult trResult = service.calculateTravel(new TravelRequest("PETROL", 5.0, null, null, 1));
        assertNotNull(trResult.factorMetadata());
        FactorDto trFactor = trResult.factorMetadata().get(0);
        assertEquals(FactorCatalog.PETROL_FACTOR_ID, trFactor.id());
        assertTrue(trFactor.limitations().contains("US EPA reference factor"));
    }
}
