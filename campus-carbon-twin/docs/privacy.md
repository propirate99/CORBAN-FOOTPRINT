# Zero-PII & Operational Privacy Guarantees

Campus Carbon Twin is architected with strict, verifiable privacy guarantees adhering to FERPA, GDPR Article 25 (Data Protection by Design and by Default), and enterprise zero-trust principles.

---

## 1. Complete Edge Isolation & Zero-PII Vision
- **In-Memory Frame Analysis:** All video frame processing takes place strictly inside client-side volatile memory using MediaPipe / WebAssembly (WASM).
- **Zero Video Transmission:** Raw camera streams, compressed frames, and image buffers are NEVER transmitted over the network, recorded to disk, or streamed to any backend service.
- **No Facial Recognition or Biometrics:** The detector utilizes a generic person class bounding-box model. It calculates zero facial landmarks, biometric vectors, or individual tracking IDs.
- **Numerical-Only Telemetry:** The only data transmitted over HTTP is a minimal occupancy payload:
  ```json
  {
    "roomId": "ROOM-SCI-204",
    "personCount": 0,
    "confidenceScore": 0.94,
    "sessionId": "session-live-001",
    "observedAt": "2026-10-16T10:30:00Z"
  }
  ```

---

## 2. Sensitive Credential & Header Redaction Policy (Requirement 9)
The system enforces strict log sanitation across all frontend client code, proxy layers, and backend Spring Boot microservices:
- **No Password Logging:** User credentials entered into auth dialogs are held only in short-lived form state and never written to browser console or application logs.
- **No Token or Header Logging:** JWT access tokens, refresh tokens, complete Supabase session payloads, and raw `Authorization: Bearer ...` headers are strictly excluded from logging statements.
- **Client Error Sanitization:** The frontend API client automatically strips and redacts Bearer tokens matching `Bearer [REDACTED]` from any error strings before displaying or logging them.

---

## 3. Data Retention & Automatic Purging
To minimize unnecessary operational storage and respect campus data lifecycle limits:
- **High-Frequency Observation Retention:** Raw room observations are retained for high-resolution real-time dashboards and then rolled up into hourly aggregated averages.
- **Automated Rollup & Purge:** An automated PostgreSQL stored procedure (`rollup_and_purge_observations()`), executed nightly via `pg_cron` (or scheduled runner), deletes raw observations older than 30 days while preserving aggregated telemetry for historical analytics.

---

## 4. Personal Footprint Privacy & Ownership
- **Row-Level Security Enforcement:** Personal footprint calculations (`personal_calculations`) are isolated at the database engine level using PostgreSQL RLS (`auth.uid() = user_id`).
- **Student Data Rights:** Students have full control to view and permanently delete their own calculation records at any time. No cross-student calculation inspection is permitted.
