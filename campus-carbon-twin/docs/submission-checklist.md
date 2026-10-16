# Submission Checklist

- [x] Clean directory and file structure matching project specification (no unwanted root files).
- [x] PostgreSQL & Supabase DBA Deployment Review documented in `docs/supabase-deployment-review.md`.
- [x] Complete PostgreSQL RLS Flyway schema in `backend/src/main/resources/db/migration/V3__supabase_rls_schema.sql` covering all 10 operational tables with idempotent operations.
- [x] Frontend Supabase integration with explicit error handling on direct RLS read failure (no silent fallbacks to sample data).
- [x] Frontend status indicators: LIVE vs DEMO toggle, explicit Supabase error banner, STALE DATA badge, and Last Updated timestamp.
- [x] Compact Supabase Auth sign-in / status widget in application header with zero password/token logging.
- [x] Spring Boot Security configuration with OAuth2 Resource Server validating JWT signature, issuer, expiration, and audience.
- [x] Database-backed authorization in `AuthUserResolver` (verifying campus membership, role, active camera assignment, and room-to-campus relationships).
- [x] Endpoint authorization and state guards in `ObservationController` (operator membership, active camera assignment, duplicate rejection, stale observation handling).
- [x] Manager campus enforcement and approval audit logging in `ActionController`.
- [x] Campus membership checks in `SimulationController`.
- [x] Automated test suites in Vitest (14/14 tests passing) and unit tests for security requirements with honest execution logs in `docs/testing-checklist.md`.
- [x] Zero-PII edge privacy guarantees and sensitive token redaction documented in `docs/privacy.md`.
- [x] Docker Compose configuration verified with `compose.yaml`.
- [x] Complete OpenAPI 3.0 API specification in `docs/api-contract.yaml`.
