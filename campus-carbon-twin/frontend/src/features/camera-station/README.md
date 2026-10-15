# Camera Station: Privacy-First Browser Edge Detection

The **Camera Station** turns any commodity laptop webcam or mobile phone browser into an anonymous, zero-PII occupancy sensor for the Campus Carbon Twin digital twin.

```
+-------------------------------------------------------------------------------+
|                      CLIENT DEVICE BROWSER (EDGE)                             |
|                                                                               |
|   +-----------------------+              +--------------------------------+   |
|   |   WebRTC Camera       |              | Local MediaPipe WASM Detector  |   |
|   |   getUserMedia()      | -----------> | EfficientDet-Lite0 (CPU mode)  |   |
|   |   (audio: false)      |              | Filters strictly for "person"  |   |
|   +-----------------------+              +---------------+----------------+   |
|                                                          |                    |
|                                           Bounding Box & | Bounding Box       |
|                                           Local Count    | Overlay (On-Device)|
|                                                          v                    |
|                                          +--------------------------------+   |
|                                          | ObservationPublisher           |   |
|                                          | (Throttle, Freshness Check)    |   |
|                                          +---------------+----------------+   |
+----------------------------------------------------------|--------------------+
                                                           |
                      Aggregate JSON Payload Only          | POST /api/v1/rooms/{id}/observations
                      (NO images, NO video, NO PII)        v
+-------------------------------------------------------------------------------+
|                      BACKEND & CAMPUS DASHBOARD TIER                          |
|                                                                               |
|   +---------------------------------------+                                   |
|   | Spring Boot Observation Controller    |                                   |
|   | Stores server receivedAt, room state  |                                   |
|   +-------------------+-------------------+                                   |
|                       |                                                       |
|                       v                                                       |
|   +---------------------------------------+                                   |
|   | Campus Dashboard (Laptop/Console)     |                                   |
|   | Displays live room status & freshness |                                   |
|   +---------------------------------------+                                   |
+-------------------------------------------------------------------------------+
```

---

## 1. Package & Asset Setup

### Model & Runtime Provenance
- **Model:** Google MediaPipe `EfficientDet-Lite0` (Float32, COCO person category).
  - Source: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite`
  - Licence: **Apache 2.0**
  - Location: `public/camera-assets/models/efficientdet_lite0.tflite`
- **WASM Runtime:** Pinned `@mediapipe/tasks-vision@0.10.14` WASM binaries.
  - Location: `public/camera-assets/wasm/`
  - Copied directly from installed package to eliminate external runtime CDN dependencies during offline/competition demos.

---

## 2. Privacy Guarantees (Zero-PII)

1. **On-Device Only:** Frames never leave local browser memory. No Canvas data URLs, WebRTC media streaming to servers, or image uploads are performed.
2. **Strict Aggregate Observation Payload:**
```json
{
  "observationId": "a9d5e382-7201-44eb-979f-0c4656ec5687",
  "cameraSessionId": "23d8c11e-b816-43cb-b03a-3d23fbf5f712",
  "peopleDetected": 2,
  "observedAt": "2026-10-15T06:40:00.124Z",
  "coverage": "DEMO_AREA",
  "source": "BROWSER_CAMERA"
}
```
3. **No Biometrics or Facial Recognition:** The model classifies only generic human contours. No facial embeddings or individual tracking IDs are generated.

---

## 3. Separation of Pipeline States

To prevent misleading dashboard behavior, the Camera Station isolates 3 distinct state categories:

| Category | States | Meaning |
| :--- | :--- | :--- |
| **Camera** | `IDLE`, `REQUESTING_PERMISSION`, `STARTING`, `RUNNING`, `STOPPED`, `ERROR` | Is the device capturing optical frames? |
| **Detector** | `NOT_LOADED`, `LOADING`, `READY`, `PROCESSING`, `STALE`, `ERROR` | Are local MediaPipe inferences succeeding? |
| **Publisher** | `UNCONNECTED`, `IDLE`, `SENDING`, `CONNECTED`, `ERROR` | Is the backend receiving aggregate counts? |

---

## 4. Lifecycle Rules & Safeguards

- **Explicit User Consent & Start:** Camera is requested only when the user accepts the privacy notice and clicks "Start Camera".
- **Zero Audio:** MediaConstraints explicitly enforce `audio: false`.
- **Immediate Stop:** Stop cancels animation loops, releases all camera tracks, clears video `srcObject`, and unmounts overlays.
- **Race Condition Prevention:** An operation token immediately stops any late-arriving stream if the user clicked Stop before permission resolved.
- **Page Hide / Backgrounding:** Capture stops automatically on `pagehide` or when the tab becomes hidden.
- **Room Isolation:** Changing room selection halts capture immediately and requires a manual restart to avoid attributing counts to the wrong room.
- **Freshness Policy:** Inferences older than 5 seconds are discarded and never published. Failed inferences never report a false "zero".

---

## 5. Laptop & Mobile Verification

| Environment | Device | Test Action | Result |
| :--- | :--- | :--- | :--- |
| **Laptop** | Chrome / macOS | Local webcam, overlay alignment, 2 FPS inference | Passed |
| **Laptop** | Firefox / macOS | Stop button releases camera light | Passed |
| **Mobile** | Safari / iOS (HTTPS required) | Front / rear camera switch, orientation change | Manual verification on device |
| **Mobile** | Chrome / Android | Backgrounding tab stops capture | Manual verification on device |

> **Note on Mobile Testing:** Mobile browsers enforce `window.isSecureContext` (HTTPS or `localhost`). When testing from a mobile phone connected to a laptop dev server, use an HTTPS tunnel (e.g. `ngrok` or mkcert) or configure `chrome://flags` for local development.
