package in.campustwin.isolatedcalculator;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = CalculatorController.class)
@Import({CalculatorService.class, ApiExceptionHandler.class})
@SuppressWarnings("null")
public class CalculatorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Endpoint test: POST /electricity success")
    void testElectricityEndpoint_Success() throws Exception {
        String json = "{\"kwh\": 100}";

        mockMvc.perform(post("/api/v1/calculator/electricity")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activityType", is("ELECTRICITY")))
                .andExpect(jsonPath("$.estimatedKgCo2", closeTo(71.6, 0.001)))
                .andExpect(jsonPath("$.factorMetadata[0].id", is("CEA_V19_FY2022_23_DEMO")));
    }

    @Test
    @DisplayName("Endpoint test: POST /electricity negative returns HTTP 400")
    void testElectricityEndpoint_NegativeKwh_Returns400() throws Exception {
        String json = "{\"kwh\": -10}";

        mockMvc.perform(post("/api/v1/calculator/electricity")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("Endpoint test: POST /equipment success")
    void testEquipmentEndpoint_Success() throws Exception {
        String json = "{\"quantity\": 8, \"wattsPerUnit\": 20, \"hoursPerDay\": 2, \"days\": 1}";

        mockMvc.perform(post("/api/v1/calculator/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activityType", is("EQUIPMENT")))
                .andExpect(jsonPath("$.quantities.estimatedKwh", closeTo(0.32, 0.001)))
                .andExpect(jsonPath("$.estimatedKgCo2", closeTo(0.22912, 0.0001)));
    }

    @Test
    @DisplayName("Endpoint test: POST /equipment >24h returns HTTP 400")
    void testEquipmentEndpoint_HoursOver24_Returns400() throws Exception {
        String json = "{\"quantity\": 1, \"wattsPerUnit\": 100, \"hoursPerDay\": 25, \"days\": 1}";

        mockMvc.perform(post("/api/v1/calculator/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    @DisplayName("Endpoint test: POST /travel distance success")
    void testTravelEndpoint_DistanceSuccess() throws Exception {
        String json = "{\"fuelType\": \"PETROL\", \"distanceKm\": 20, \"mileageKmPerLitre\": 40, \"occupants\": 2}";

        mockMvc.perform(post("/api/v1/calculator/travel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activityType", is("TRAVEL")))
                .andExpect(jsonPath("$.quantities.fuelLitres", closeTo(0.5, 0.001)))
                .andExpect(jsonPath("$.allocatedKgCo2PerOccupant", notNullValue()));
    }

    @Test
    @DisplayName("Endpoint test: POST /travel both methods returns HTTP 400")
    void testTravelEndpoint_BothMethods_Returns400() throws Exception {
        String json = "{\"fuelType\": \"PETROL\", \"fuelLitres\": 2, \"distanceKm\": 20, \"mileageKmPerLitre\": 40, \"occupants\": 1}";

        mockMvc.perform(post("/api/v1/calculator/travel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    @DisplayName("Endpoint test: GET /factors returns list of 3 catalog factors")
    void testGetFactors() throws Exception {
        mockMvc.perform(get("/api/v1/calculator/factors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    @DisplayName("Endpoint test: GET /health returns UP status")
    void testGetHealth() throws Exception {
        mockMvc.perform(get("/api/v1/calculator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }
}
