import React, { useEffect, useRef, useState } from 'react';
import {
  Camera, X, Minimize2, Maximize2, RefreshCw, Video, Eye,
  ShieldCheck, Sliders, Zap, Users, AlertCircle, ChevronDown
} from 'lucide-react';

/**
 * Picture-in-Picture Live Video Modal with COCO-SSD Bounding Boxes & Phone-as-Webcam selector.
 */
export default function CameraPipModal({
  isOpen,
  onClose,
  isCameraActive,
  isModelLoading,
  cameraDevices = [],
  selectedDeviceId,
  onSelectDevice,
  onStartCamera,
  onStopCamera,
  simulatedCameraMode,
  onToggleSimulateCamera,
  simulatedPeopleCount,
  onChangeSimulatedPeople,
  simulatedLightsOn,
  onToggleSimulatedLights,
  currentBrightness,
  lightThreshold,
  onChangeLightThreshold,
  cameraError,
  videoRef,
  overlayCanvasRef,
  detections = [],
  lab1Telemetry = {}
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Redraw COCO-SSD / MediaPipe bounding boxes on the overlay canvas
  useEffect(() => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isCameraActive && detections && detections.length > 0) {
      detections.forEach((det, i) => {
        if (!det || !det.bbox) return;
        const [x, y, w, h] = det.bbox;
        const score = Math.round((det.score || 0.9) * 100);

        // Draw bounding box
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        // Draw corner brackets
        ctx.fillStyle = '#10b981';
        const cl = 8;
        ctx.fillRect(x - 1, y - 1, cl, 3);
        ctx.fillRect(x - 1, y - 1, 3, cl);
        ctx.fillRect(x + w - cl + 1, y - 1, cl, 3);
        ctx.fillRect(x + w - 2, y - 1, 3, cl);

        // Label background & text
        ctx.fillStyle = 'rgba(6, 24, 20, 0.85)';
        ctx.fillRect(x, Math.max(0, y - 22), 110, 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText(`👤 Person ${i + 1} (${score}%)`, x + 6, Math.max(14, y - 8));

        // Centroid marker for spatial twin mapping
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  }, [detections, isCameraActive, overlayCanvasRef, videoRef]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isFullscreen ? '0' : '1.5rem',
        right: isFullscreen ? '0' : '1.5rem',
        width: isFullscreen ? '100vw' : isMinimized ? '320px' : '480px',
        maxWidth: '95vw',
        height: isFullscreen ? '100vh' : 'auto',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: isFullscreen ? '0' : '12px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.25s ease'
      }}
    >
      {/* PiP Header */}
      <div
        style={{
          background: '#061814',
          color: '#ffffff',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #13382f'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isCameraActive ? '#ef4444' : '#64748b',
              animation: isCameraActive ? 'twinLivePulse 1.2s infinite' : 'none'
            }}
          />
          <Camera size={16} color="#10b981" />
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Lab 1 CCTV Vision (CAM-01)
          </span>
          {isCameraActive && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                background: '#dc2626',
                color: '#fff',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                letterSpacing: '0.04em'
              }}
            >
              LIVE
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="pip-hdr-btn"
            title={isMinimized ? 'Expand PiP' : 'Minimize PiP'}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
          >
            <Minimize2 size={15} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="pip-hdr-btn"
            title={isFullscreen ? 'Restore standard size' : 'Expand full screen'}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
          >
            <Maximize2 size={15} />
          </button>
          <button
            onClick={onClose}
            className="pip-hdr-btn"
            title="Close Live Video Overlay"
            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* PiP Body */}
      {!isMinimized && (
        <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: isFullscreen ? 'calc(100vh - 50px)' : '80vh' }}>
          {/* Video Stream + Bounding Box Canvas Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              background: '#090d16',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Live Video */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isCameraActive ? 'block' : 'none'
              }}
            />

            {/* Bounding Box Canvas overlay */}
            <canvas
              ref={overlayCanvasRef}
              width={320}
              height={240}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                display: isCameraActive ? 'block' : 'none'
              }}
            />

            {/* Off-Camera Placeholder / Simulation Preview */}
            {!isCameraActive && (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>
                <Video size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
                  {simulatedCameraMode ? 'Camera Simulation Mode Active' : 'Live Camera Standby'}
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {simulatedCameraMode
                    ? `Simulating ${simulatedPeopleCount} occupants • Lights ${simulatedLightsOn ? 'ON' : 'OFF'}`
                    : 'Click "Start Camera" to connect webcam or phone-as-webcam'}
                </div>
              </div>
            )}

            {/* Headcount Chip in Corner */}
            <div
              style={{
                position: 'absolute',
                top: '0.5rem',
                left: '0.5rem',
                background: 'rgba(6, 24, 20, 0.85)',
                color: '#ffffff',
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.725rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: '1px solid #13382f'
              }}
            >
              <Users size={12} color="#10b981" />
              <span>
                {isCameraActive
                  ? `${detections.length} ${detections.length === 1 ? 'Person' : 'People'} Counted`
                  : simulatedCameraMode
                  ? `${simulatedPeopleCount} Simulated Occupants`
                  : '0 Detected'}
              </span>
            </div>
          </div>

          {/* Camera Device Selector (Phone-as-Webcam / DroidCam / USB) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
              Video Input Source (Supports Phone-as-Webcam):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                id="camera-device-select"
                value={selectedDeviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0f172a'
                }}
              >
                {cameraDevices.length > 0 ? (
                  cameraDevices.map((dev, idx) => (
                    <option key={dev.deviceId || idx} value={dev.deviceId}>
                      {dev.label || `Camera ${idx + 1} (${dev.deviceId.slice(0, 8)}...)`}
                    </option>
                  ))
                ) : (
                  <option value="">Default System Webcam / Phone Cam</option>
                )}
              </select>

              {!isCameraActive ? (
                <button
                  onClick={onStartCamera}
                  disabled={isModelLoading}
                  className="twin-btn pri"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  {isModelLoading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Camera size={13} />
                      Start Camera
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={onStopCamera}
                  className="twin-btn danger"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  Stop Camera
                </button>
              )}
            </div>
          </div>

          {/* Fallback Simulation Mode Toggle */}
          <div
            style={{
              padding: '0.65rem 0.85rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                Simulation Fallback (No Webcam Required):
              </span>
              <button
                id="btn-pip-simulate"
                onClick={onToggleSimulateCamera}
                className={`twin-btn ${simulatedCameraMode ? 'pri' : ''}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.725rem' }}
              >
                {simulatedCameraMode ? 'Simulation Active' : 'Enable Simulation'}
              </button>
            </div>

            {simulatedCameraMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Simulated People:
                  <select
                    value={simulatedPeopleCount}
                    onChange={(e) => onChangeSimulatedPeople(Number(e.target.value))}
                    style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #86efac' }}
                  >
                    <option value="0">0 (Trigger leak)</option>
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="5">5 People</option>
                  </select>
                </label>

                <label style={{ fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="checkbox"
                    checked={simulatedLightsOn}
                    onChange={(e) => onToggleSimulatedLights(e.target.checked)}
                  />
                  Lights ON
                </label>
              </div>
            )}
          </div>

          {/* Luminance Detection Sensitivity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569' }}>
              <span>Luminance Threshold: <strong>{lightThreshold}</strong></span>
              <span>
                Current Brightness:{' '}
                <strong>{currentBrightness !== null ? currentBrightness : '--'}</strong>
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="140"
              value={lightThreshold}
              onChange={(e) => onChangeLightThreshold(Number(e.target.value))}
              className="twin-slider"
              style={{ margin: '0.25rem 0' }}
            />
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Average pixel brightness above threshold marks Lab 1 lighting as <strong>ON (0.4 kW)</strong>.
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              fontSize: '0.725rem',
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <ShieldCheck size={14} color="#059669" style={{ flexShrink: 0 }} />
            <span>
              <strong>Zero-PII Privacy:</strong> In-browser edge inference only. Video frames are analyzed locally in RAM and never saved, transmitted, or recorded.
            </span>
          </div>

          {cameraError && (
            <div style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>
              {cameraError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
