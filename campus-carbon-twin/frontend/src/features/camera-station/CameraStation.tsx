import React from 'react';
import { useCameraStation } from './useCameraStation';
import { CameraControls } from './components/CameraControls';
import { CameraPreview } from './components/CameraPreview';
import { ObservationSettings } from './components/ObservationSettings';
import { CameraStatusPanel } from './components/CameraStatusPanel';
import { PrivacyNotice } from './components/PrivacyNotice';
import { ObservationTransport } from './observationTransport';
import './CameraStation.css';

interface CameraStationProps {
  initialRoomId?: string;
  transport?: ObservationTransport;
  onLocalObservation?: (roomId: string, count: number, timestamp: string) => void;
}

export const CameraStation: React.FC<CameraStationProps> = ({
  initialRoomId = 'A-101',
  transport,
  onLocalObservation,
}) => {
  const {
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
  } = useCameraStation(initialRoomId, transport, onLocalObservation);

  return (
    <div className="camera-station-container">
      <div className="camera-station-header">
        <h2>Edge Camera Station</h2>
        <p>
          Transform any mobile phone or laptop into a privacy-preserving digital twin occupancy sensor.
          Frames are processed locally in device memory via MediaPipe WASM. Only anonymous occupant counts
          are synchronized with the campus twin.
        </p>
      </div>

      <PrivacyNotice />

      <CameraControls
        roomId={roomId}
        onRoomChange={setRoomId}
        consentGiven={consentGiven}
        onConsentChange={setConsentGiven}
        cameraState={cameraState}
        onStart={startCamera}
        onStop={stopCamera}
        onSwitchCamera={switchCamera}
        settings={settings}
        onToggleHidePreview={(hide) => setSettings((s) => ({ ...s, hidePreview: hide }))}
      />

      <div className="camera-station-viewport-section">
        <CameraPreview
          videoRef={videoRef}
          cameraState={cameraState}
          facingMode={settings.facingMode}
          hidePreview={settings.hidePreview}
          latestDetection={latestDetection}
        />
      </div>

      <ObservationSettings
        settings={settings}
        onChange={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
        disabled={cameraState === 'RUNNING'}
      />

      <CameraStatusPanel
        cameraState={cameraState}
        detectorState={detectorState}
        publisherState={publisherState}
        cameraError={cameraError}
        detectorError={detectorError}
        publisherError={publisherError}
        latestDetection={latestDetection}
        lastAck={lastAck}
        roomId={roomId}
      />
    </div>
  );
};
