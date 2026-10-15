import React, { useRef, useState, useEffect } from 'react';
import { initializeCamera, stopCamera } from './camera';
import { EdgeDetector, DetectionResult } from './detector';
import { CameraOverlay } from './CameraOverlay';
import { ObservationStatus } from '../../components/ObservationStatus';
import { ObservationPublisher } from './observationPublisher';

export const CameraPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detection, setDetection] = useState<DetectionResult>({ personCount: 1, confidenceScore: 0.94 });
  const [isPublishing, setIsPublishing] = useState<boolean>(true);
  const [lastSync, setLastSync] = useState<string>(new Date().toISOString());

  useEffect(() => {
    const detector = new EdgeDetector();
    let animFrame: number;

    const start = async () => {
      await detector.loadModel();
      if (videoRef.current) {
        const activeStream = await initializeCamera(videoRef.current);
        setStream(activeStream);
      }

      const loop = () => {
        if (videoRef.current) {
          const res = detector.detectFrame(videoRef.current);
          setDetection(res);
        }
        animFrame = requestAnimationFrame(loop);
      };
      loop();
    };

    start();

    const publisher = new ObservationPublisher('ROOM-SCI-204', (ts) => setLastSync(ts));
    publisher.startPublishing(() => ({ count: detection.personCount, confidence: detection.confidenceScore }));

    return () => {
      cancelAnimationFrame(animFrame);
      stopCamera(stream);
      publisher.stopPublishing();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
        <h2 style={{ marginTop: 0 }}>Privacy-Preserving Edge Vision Node</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          This edge node processes optical frames completely in browser memory using TensorFlow Lite / WASM.
          No images or video leave this workstation. Only numerical occupancy counts are synced to the twin.
        </p>

        <ObservationStatus isPublishing={isPublishing} lastSuccessTimestamp={lastSync} count={detection.personCount} />

        <div style={{ marginTop: '1.5rem', position: 'relative', maxWidth: '640px', background: '#0f172a', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <CameraOverlay
            boxes={detection.boxes}
            personCount={detection.personCount}
            videoWidth={640}
            videoHeight={480}
          />
        </div>
      </div>
    </div>
  );
};
