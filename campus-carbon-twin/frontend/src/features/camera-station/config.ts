export const CAMERA_CONFIG = {
  // Video Constraints
  video: {
    idealWidth: 640,
    idealHeight: 480,
    audio: false, // Strict: never request microphone access
  },

  // Detection Throttle & Freshness
  inferenceThrottleMs: 500, // ~2 inferences per second to prevent main thread blocking
  inferenceFreshnessLimitMs: 5000, // Inferences older than 5s are considered stale and not published

  // Publishing Intervals
  defaultPublishIntervalMs: 5000,
  publishIntervalOptionsMs: [2000, 5000, 10000],

  // Default Detection Confidence
  defaultConfidenceThreshold: 0.5,
  minConfidenceThreshold: 0.2,
  maxConfidenceThreshold: 0.95,

  // Backend Stale Timers
  backendObservationStaleTimeoutMs: 20000,
  normalVacancyGraceMinutes: 10,
  demoVacancyGraceSeconds: 30,

  // Asset paths (respecting deployment base path)
  modelRelativePath: 'camera-assets/models/efficientdet_lite0.tflite',
  wasmRelativePath: 'camera-assets/wasm',
} as const;
