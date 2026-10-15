import { useState, useRef, useEffect, useCallback } from 'react';
import { CameraController } from './cameraController';
import { PersonDetector } from './personDetector';
import { ObservationPublisher } from './observationPublisher';
import { HttpObservationTransport, ObservationTransport } from './observationTransport';
import {
  CameraState,
  DetectorState,
  PublisherState,
  DetectionResult,
  ObservationAck,
  CameraStationSettings,
} from './types';
import { CAMERA_CONFIG } from './config';

export function useCameraStation(
  initialRoomId: string = 'ROOM-SCI-204',
  customTransport?: ObservationTransport,
  onLocalObservation?: (roomId: string, count: number, timestamp: string) => void
) {
  const [roomId, setRoomIdState] = useState<string>(initialRoomId);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [cameraState, setCameraState] = useState<CameraState>('IDLE');
  const [detectorState, setDetectorState] = useState<DetectorState>('NOT_LOADED');
  const [publisherState, setPublisherState] = useState<PublisherState>('UNCONNECTED');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectorError, setDetectorError] = useState<string | null>(null);
  const [publisherError, setPublisherError] = useState<string | null>(null);

  const [latestDetection, setLatestDetection] = useState<DetectionResult | null>(null);
  const [lastAck, setLastAck] = useState<ObservationAck | null>(null);

  const [settings, setSettings] = useState<CameraStationSettings>({
    confidenceThreshold: CAMERA_CONFIG.defaultConfidenceThreshold,
    publishIntervalMs: CAMERA_CONFIG.defaultPublishIntervalMs,
    facingMode: 'user',
    hidePreview: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const detectorRef = useRef<PersonDetector | null>(null);
  const publisherRef = useRef<ObservationPublisher | null>(null);
  const loopActiveRef = useRef<boolean>(false);
  const lastInferenceCallTimeRef = useRef<number>(0);
  const latestInferenceRef = useRef<DetectionResult | null>(null);

  // Initialize controllers
  useEffect(() => {
    const transport = customTransport || new HttpObservationTransport();

    const controller = new CameraController((state, err) => {
      setCameraState(state);
      setCameraError(err || null);
    });
    cameraControllerRef.current = controller;

    const detector = new PersonDetector((state, err) => {
      setDetectorState(state);
      setDetectorError(err || null);
    });
    detectorRef.current = detector;

    const publisher = new ObservationPublisher(
      transport,
      roomId,
      settings.publishIntervalMs,
      (state, err) => {
        setPublisherState(state);
        setPublisherError(err || null);
      },
      (ack) => {
        setLastAck(ack);
      }
    );
    publisherRef.current = publisher;

    // Load MediaPipe Model on mount
    detector.initialize();

    return () => {
      loopActiveRef.current = false;
      controller.stopCamera(videoRef.current);
      publisher.stopPublishing();
      detector.dispose();
    };
  }, []);

  // Sync threshold changes with detector
  useEffect(() => {
    if (detectorRef.current) {
      detectorRef.current.setThreshold(settings.confidenceThreshold);
    }
  }, [settings.confidenceThreshold]);

  // Sync publishing interval changes with publisher
  useEffect(() => {
    if (publisherRef.current) {
      publisherRef.current.setInterval(settings.publishIntervalMs);
    }
  }, [settings.publishIntervalMs]);

  // Main Inference Loop
  const runInferenceLoop = useCallback(() => {
    if (!loopActiveRef.current) return;

    const now = performance.now();
    const elapsed = now - lastInferenceCallTimeRef.current;

    if (elapsed >= CAMERA_CONFIG.inferenceThrottleMs && videoRef.current && detectorRef.current) {
      lastInferenceCallTimeRef.current = now;
      const res = detectorRef.current.detectFrame(videoRef.current);

      if (res) {
        latestInferenceRef.current = res;
        setLatestDetection(res);

        if (onLocalObservation) {
          onLocalObservation(roomId, res.personCount, res.wallClockIso);
        }
      }
    }

    if (loopActiveRef.current) {
      requestAnimationFrame(runInferenceLoop);
    }
  }, [roomId, onLocalObservation]);

  // Start Camera handler
  const startCamera = async () => {
    if (!consentGiven) {
      setCameraError('You must review and accept the Privacy Notice before starting capture.');
      return;
    }
    if (!videoRef.current || !cameraControllerRef.current) {
      return;
    }

    const success = await cameraControllerRef.current.startCamera(
      videoRef.current,
      settings.facingMode
    );

    if (success) {
      loopActiveRef.current = true;
      lastInferenceCallTimeRef.current = 0;
      requestAnimationFrame(runInferenceLoop);

      if (publisherRef.current) {
        publisherRef.current.startPublishing(() => latestInferenceRef.current);
      }
    }
  };

  // Stop Camera handler
  const stopCamera = () => {
    loopActiveRef.current = false;

    if (cameraControllerRef.current) {
      cameraControllerRef.current.stopCamera(videoRef.current);
    }
    if (publisherRef.current) {
      publisherRef.current.stopPublishing();
    }
    if (detectorRef.current) {
      detectorRef.current.reset();
    }

    latestInferenceRef.current = null;
    setLatestDetection(null);
  };

  // Switch camera (front / rear)
  const switchCamera = async () => {
    if (!videoRef.current || !cameraControllerRef.current) return;
    const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user';
    setSettings((prev) => ({ ...prev, facingMode: newFacingMode }));

    const success = await cameraControllerRef.current.switchCamera(videoRef.current);
    if (success && !loopActiveRef.current) {
      loopActiveRef.current = true;
      requestAnimationFrame(runInferenceLoop);
      if (publisherRef.current) {
        publisherRef.current.startPublishing(() => latestInferenceRef.current);
      }
    }
  };

  // Room change handler: strictly stops and requires deliberate restart
  const setRoomId = (newRoomId: string) => {
    if (newRoomId === roomId) return;
    stopCamera();
    setRoomIdState(newRoomId);
    if (publisherRef.current) {
      publisherRef.current.setRoomId(newRoomId);
    }
  };

  // Page hide / visibility listener: release capture on backgrounding
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        stopCamera();
      }
    };

    const handlePageHide = () => {
      stopCamera();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return {
    videoRef,
    roomId,
    setRoomId,
    consentGiven,
    setConsentGiven,
    cameraState,
    detectorState,
    publisherState,
    cameraError,
    detectorError,
    publisherError,
    latestDetection,
    lastAck,
    settings,
    setSettings,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
