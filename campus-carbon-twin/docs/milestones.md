# Development Milestones & Delivery Roadmap

## Milestone 1: Core Foundation & Digital Twin Backbone
- [x] Schema DDL and domain migrations (Flyway V1, V2).
- [x] Room and Equipment entity relationships and base repository layer.
- [x] Energy calculation utility ($P_{total} = \sum P_{equip}$).
- [x] Mock and seed dataset generation (`data/*.json`).

## Milestone 2: Privacy-First Edge Vision Ingestion
- [x] Browser-based WebRTC camera integration and client-side inference loop.
- [x] Observation REST API ingestion pipeline with deduplication.
- [x] Real-time websocket/polling synchronization with RoomCard state.
- [x] Evidence badge displaying edge confidence metrics.

## Milestone 3: Waste Detection & What-If Simulation Engine
- [x] Eligibility rules engine detecting vacant classrooms with running HVAC/lighting.
- [x] Scenario simulator for thermostat setpoint deltas and auto-shutoff policies.
- [x] Side-by-side scenario comparison visualizations in frontend.

## Milestone 4: Explainable AI & Action Automation
- [x] Gemini LLM integration for contextual mitigation explanations.
- [x] Fallback rule-based template explanation service.
- [x] Action approval timeline and savings audit tracker.
- [x] Personal Student/Faculty carbon calculator.
