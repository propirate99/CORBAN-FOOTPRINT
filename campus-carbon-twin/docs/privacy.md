# Zero-PII Edge Camera Privacy Guarantee

Campus Carbon Twin is architected with strict, verifiable privacy guarantees:

## 1. Complete Edge Isolation
- All video frame processing takes place **strictly in client-side memory** using WebAssembly (WASM) / TensorFlow Lite.
- The browser camera stream is never transmitted over the network, recorded to disk, or buffered in any server.

## 2. Zero-PII Payload
The only data transmitted from the client to the backend is a lightweight numerical observation vector:
```json
{
  "roomId": "ROOM-SCI-204",
  "personCount": 0,
  "confidenceScore": 0.94,
  "timestamp": "2026-10-15T10:30:00Z"
}
```

## 3. No Facial Recognition or Biometrics
- The detector model is a generic bounding-box person detector (COCO person class only).
- No facial landmarks, identity recognition, or tracking tokens are calculated or stored.

## 4. Compliance & Auditability
- Complies with FERPA and GDPR Article 25 (Data Protection by Design and by Default).
- Faculty and students can verify privacy by inspecting browser network telemetry in DevTools.
