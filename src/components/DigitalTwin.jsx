import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, Eye, EyeOff, Zap, AlertTriangle, AlertCircle, CheckCircle2,
  Sliders, Camera, RefreshCw, Power, Video, HelpCircle, Activity,
  Clock, IndianRupee, Leaf, Volume2, ArrowLeft, RotateCcw,
  Layers, MapPin, Maximize2, Copy, Check, ExternalLink, Settings
} from 'lucide-react';
import {
  TWIN_CONFIG,
  calculateRoomPower,
  calculateIdleWastePower
} from '../config/twinConfig';
import { PLAN_CONFIG } from '../config/plan.config';
import ArchitecturalPlanSvg from './ArchitecturalPlanSvg';
import CameraPipModal from './CameraPipModal';

export default function DigitalTwin({ onBackToDashboard }) {
  // Rooms state
  const [rooms, setRooms] = useState(() =>
    TWIN_CONFIG.INITIAL_ROOMS.map(r => ({
      ...r,
      kw: calculateRoomPower(r)
    }))
  );

  const [selectedId, setSelectedId] = useState('room_1');
  const [leakThresholdSeconds, setLeakThresholdSeconds] = useState(TWIN_CONFIG.DEFAULT_LEAK_SECONDS);
  const [idleHours, setIdleHours] = useState(TWIN_CONFIG.DEFAULT_IDLE_HOURS);
  const [lightThreshold, setLightThreshold] = useState(TWIN_CONFIG.DEFAULT_LIGHT_THRESHOLD);

  // Layer Visibility Toggles (Plan, Energy, Cameras, People)
  const [layers, setLayers] = useState({
    plan: true,
    energy: true,
    cameras: true,
    people: true
  });

  // Edit / Trace Mode for Polygon Calibration
  const [editMode, setEditMode] = useState(false);
  const [copiedCoordToast, setCopiedCoordToast] = useState(null);

  // Picture-in-Picture Video Modal state
  const [isPipOpen, setIsPipOpen] = useState(false);

  // Video Device Enumeration (Webcams / Phone-as-Webcam)
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Totals & Alerts
  const [totalKwh, setTotalKwh] = useState(0);
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      time: new Date().toLocaleTimeString(),
      text: 'Campus Architectural Digital Twin initialized. 2D CAD plan with live CCTV vision active.'
    }
  ]);

  // Camera & Vision state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [currentBrightness, setCurrentBrightness] = useState(null);
  const [simulatedCameraMode, setSimulatedCameraMode] = useState(false);
  const [simulatedPeopleCount, setSimulatedPeopleCount] = useState(0);
  const [simulatedLightsOn, setSimulatedLightsOn] = useState(true);
  const [rawDetections, setRawDetections] = useState([]);

  // Refs for camera and detection loop
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const modelRef = useRef(null);
  const streamRef = useRef(null);
  const detectionTimeoutRef = useRef(null);
  const isCameraActiveRef = useRef(false);
  isCameraActiveRef.current = isCameraActive;

  // Sound alert / notification helper
  const addAlert = useCallback((text) => {
    const timestamp = new Date().toLocaleTimeString();
    setAlerts(prev => [
      { id: Date.now() + Math.random(), time: timestamp, text },
      ...prev.slice(0, 19)
    ]);
  }, []);

  // Enumerate video input devices (phone-as-webcam, DroidCam, Camo, USB webcams)
  useEffect(() => {
    const refreshDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setCameraDevices(videoInputs);
          if (videoInputs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoInputs[0].deviceId);
          }
        }
      } catch (err) {
        console.warn('enumerateDevices error:', err);
      }
    };
    refreshDevices();
  }, [selectedDeviceId]);

  // Helper to load coco-ssd model safely
  const loadVisionModel = async () => {
    if (modelRef.current) return modelRef.current;

    if (typeof window !== 'undefined' && window.cocoSsd) {
      const loaded = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
      modelRef.current = loaded;
      return loaded;
    }

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const checkInterval = setInterval(async () => {
        attempts++;
        if (typeof window !== 'undefined' && window.cocoSsd) {
          clearInterval(checkInterval);
          try {
            const loaded = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
            modelRef.current = loaded;
            resolve(loaded);
          } catch (e) {
            reject(e);
          }
        } else if (attempts > 30) {
          clearInterval(checkInterval);
          reject(new Error('TensorFlow COCO-SSD failed to initialize within timeout.'));
        }
      }, 300);
    });
  };

  // Run vision inference loop on video frames
  const runVisionDetection = useCallback(async () => {
    if (!isCameraActiveRef.current || !videoRef.current || !canvasRef.current || !modelRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= 2) {
      try {
        // Detect people using COCO-SSD
        const predictions = await modelRef.current.detect(video);
        const personPredictions = predictions.filter(
          p => p.class === 'person' && p.score >= 0.45
        );

        setRawDetections(personPredictions);
        const peopleDetected = personPredictions.length;

        // Measure average brightness using off-screen 32x24 canvas
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, 32, 24);
        const imgData = ctx.getImageData(0, 0, 32, 24).data;
        let sumLuminance = 0;
        const totalPixels = imgData.length / 4;

        for (let i = 0; i < imgData.length; i += 4) {
          sumLuminance += 0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2];
        }

        const avgBrightness = sumLuminance / totalPixels;
        setCurrentBrightness(Math.round(avgBrightness));
        const detectedLightsOn = avgBrightness > lightThreshold;

        // Update Lab 1 telemetry with REAL camera vision values
        setRooms(prev => prev.map((r, i) => {
          if (i === 0) {
            return {
              ...r,
              people: peopleDetected,
              lights: detectedLightsOn,
              ac: r.forget ? r.ac : peopleDetected > 0
            };
          }
          return r;
        }));
      } catch (err) {
        console.warn('Vision detection step error:', err);
      }
    }

    if (isCameraActiveRef.current) {
      detectionTimeoutRef.current = setTimeout(runVisionDetection, TWIN_CONFIG.VISION_DETECTION_INTERVAL_MS);
    }
  }, [lightThreshold]);

  // Start Webcam or selected phone-as-webcam
  const startCamera = async (targetDeviceId = selectedDeviceId) => {
    setCameraError('');
    setIsModelLoading(true);

    try {
      await loadVisionModel();

      const videoConstraints = targetDeviceId
        ? { deviceId: { exact: targetDeviceId }, width: { ideal: 320 }, height: { ideal: 240 } }
        : { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setSimulatedCameraMode(false);
      setIsModelLoading(false);
      addAlert('CAM-01 connected. Zero-PII real-time occupancy counting active.');
    } catch (err) {
      console.error('Camera startup error:', err);
      setIsModelLoading(false);
      setIsCameraActive(false);
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in browser, or use "Simulate Camera" mode.'
        : `Camera unavailable (${err.message}). Use "Simulate Camera" mode below to test live leak detection.`;
      setCameraError(msg);
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCurrentBrightness(null);
    setRawDetections([]);
    addAlert('CAM-01 camera stopped. Lab 1 returned to simulated occupancy walk.');
  };

  // Handle detection loop start/stop
  useEffect(() => {
    if (isCameraActive) {
      runVisionDetection();
    }
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [isCameraActive, runVisionDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Update Lab 1 when in Simulated Camera mode
  useEffect(() => {
    if (simulatedCameraMode) {
      setRooms(prev => prev.map((r, i) => {
        if (i === 0) {
          return {
            ...r,
            people: simulatedPeopleCount,
            lights: simulatedLightsOn,
            ac: r.forget ? r.ac : simulatedPeopleCount > 0
          };
        }
        return r;
      }));
    }
  }, [simulatedCameraMode, simulatedPeopleCount, simulatedLightsOn]);

  // Main Meter Engine Tick: runs every 1000ms (1 second = 1 minute of demo simulation)
  useEffect(() => {
    const timer = setInterval(() => {
      setRooms(prevRooms => {
        let addedKwhTick = 0;
        const updated = prevRooms.map((r, idx) => {
          const isLiveLab1 = idx === 0 && (isCameraActive || simulatedCameraMode);

          let updatedPeople = r.people;
          let updatedAc = r.ac;
          let updatedLights = r.lights;

          // Simulated rooms walk occupancy
          if (!isLiveLab1 && !r.forget && Math.random() < 0.06) {
            const delta = Math.random() < 0.5 ? -1 : 1;
            updatedPeople = Math.max(0, Math.min(5, updatedPeople + delta));
            updatedAc = updatedPeople > 0;
            updatedLights = updatedPeople > 0;
          }

          const currentRoomKw = calculateRoomPower({
            ...r,
            ac: updatedAc,
            lights: updatedLights
          });

          // Check idle status: room empty (0 people) with active load
          const isUnoccupiedWithLoad = updatedPeople === 0 && (updatedAc || updatedLights);
          const nextIdle = isUnoccupiedWithLoad ? r.idle + 1 : 0;

          // Determine leak status
          const prevStatus = r.status;
          let nextStatus = 'ok';
          if (nextIdle >= leakThresholdSeconds) {
            nextStatus = 'leak';
          } else if (nextIdle > 0) {
            nextStatus = 'warn';
          }

          // Trigger timestamped alert on transition into LEAK
          if (nextStatus === 'leak' && prevStatus !== 'leak') {
            const wasteKw = Math.max(0, currentRoomKw - TWIN_CONFIG.STANDBY_KW);
            addAlert(`⚠️ ${r.name}: Unoccupied for ${leakThresholdSeconds}s with active load. Energy leak wasting ${wasteKw.toFixed(2)} kW!`);
          }

          // Cumulative energy integration
          const tickKwh = (currentRoomKw * TWIN_CONFIG.SIM_SPEED) / 3600;
          addedKwhTick += tickKwh;

          let tickWasteKwh = r.wasteKwh;
          if (nextIdle > 0) {
            const wasteKw = Math.max(0, currentRoomKw - TWIN_CONFIG.STANDBY_KW);
            tickWasteKwh += (wasteKw * TWIN_CONFIG.SIM_SPEED) / 3600;
          }

          return {
            ...r,
            people: updatedPeople,
            ac: updatedAc,
            lights: updatedLights,
            kw: currentRoomKw,
            idle: nextIdle,
            status: nextStatus,
            wasteKwh: tickWasteKwh
          };
        });

        setTotalKwh(k => k + addedKwhTick);
        return updated;
      });
    }, TWIN_CONFIG.METER_ENGINE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isCameraActive, simulatedCameraMode, leakThresholdSeconds, addAlert]);

  // Aggregate Metrics
  const totalKw = rooms.reduce((acc, r) => acc + r.kw, 0);
  const totalWasteKwh = rooms.reduce((acc, r) => acc + r.wasteKwh, 0);
  const activeLeaksCount = rooms.filter(r => r.status === 'leak').length;
  const totalCo2Kg = totalKwh * TWIN_CONFIG.EMISSION_FACTOR;

  // Selected Room
  const selectedRoom = rooms.find(r => r.id === selectedId) || rooms[0];

  // Room action handlers
  const handleToggleAc = () => {
    setRooms(prev => prev.map(r => {
      if (r.id === selectedId) {
        const nextAc = !r.ac;
        return {
          ...r,
          ac: nextAc,
          kw: calculateRoomPower({ ...r, ac: nextAc })
        };
      }
      return r;
    }));
  };

  const handleToggleLights = () => {
    setRooms(prev => prev.map(r => {
      if (r.id === selectedId) {
        const nextLights = !r.lights;
        return {
          ...r,
          lights: nextLights,
          kw: calculateRoomPower({ ...r, lights: nextLights })
        };
      }
      return r;
    }));
  };

  const handleTriggerForgetLeak = () => {
    setRooms(prev => prev.map(r => {
      if (r.id === selectedId) {
        addAlert(`Demo action: Left AC & lights ON in empty room [${r.name}]. Leak timer running...`);
        return {
          ...r,
          forget: true,
          people: 0,
          ac: true,
          lights: true,
          idle: 0,
          status: 'ok',
          kw: calculateRoomPower({ ...r, ac: true, lights: true })
        };
      }
      return r;
    }));
  };

  const handleFixRoom = () => {
    setRooms(prev => prev.map(r => {
      if (r.id === selectedId) {
        addAlert(`Mitigation executed: Switched off AC and lights in [${r.name}]. Leak stopped.`);
        return {
          ...r,
          forget: false,
          ac: false,
          lights: false,
          idle: 0,
          status: 'ok',
          kw: calculateRoomPower({ ...r, ac: false, lights: false })
        };
      }
      return r;
    }));
  };

  // What-if calculation
  const totalIdleKw = rooms.reduce((acc, r) => {
    return acc + (r.idle > 0 ? Math.max(0, r.kw - TWIN_CONFIG.STANDBY_KW) : 0);
  }, 0);
  const whatIfMonthlyKwh = totalIdleKw * idleHours * 30;
  const whatIfMonthlyCo2 = whatIfMonthlyKwh * TWIN_CONFIG.EMISSION_FACTOR;
  const whatIfMonthlyCost = whatIfMonthlyKwh * TWIN_CONFIG.TARIFF;

  // Handle plan coordinate click in Edit Mode
  const handlePlanClickCoordinate = (coords) => {
    const coordStr = `x: ${coords.pctX}%, y: ${coords.pctY}% (svg: ${coords.svgX}, ${coords.svgY})`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(coordStr);
      }
    } catch (e) {
      console.log('Clipboard copy skipped');
    }
    setCopiedCoordToast(coordStr);
    setTimeout(() => setCopiedCoordToast(null), 3500);
  };

  return (
    <div className="twin-page-bg" style={{ minHeight: '100vh', padding: '1.25rem 0 3rem' }}>
      <div className="twin-container">
        {/* Top Header Card */}
        <header
          style={{
            background: '#ffffff',
            border: '1px solid #dbe4ee',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 4px 15px rgba(15, 23, 42, 0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#fff',
                  padding: '0.4rem 0.55rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                }}>
                  <Activity size={22} />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Campus Energy Digital Twin
                  </h1>
                  <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Architectural CAD Plan • Edge Computer Vision Telemetry
                  </div>
                </div>
                <span className="pill pill-emerald" style={{ fontSize: '0.75rem', fontWeight: 700, marginLeft: '0.5rem' }}>
                  Block A • Floor 2
                </span>
              </div>
              <p style={{ margin: '0.45rem 0 0', color: '#64748b', fontSize: '0.85rem', maxWidth: '850px' }}>
                Top-down architectural 2D floor plan with spatial CAD walls, door swing arcs, furniture, live CCTV vision overlays, and simulated energy load telemetry.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {onBackToDashboard && (
                <button
                  onClick={onBackToDashboard}
                  className="twin-btn"
                  style={{ background: '#f8fafc' }}
                  title="Return to Executive Dashboard"
                >
                  <ArrowLeft size={15} />
                  Dashboard
                </button>
              )}

              <button
                id="btn-open-pip-top"
                onClick={() => setIsPipOpen(true)}
                className="twin-btn pri"
              >
                <Video size={15} />
                Live Vision PiP
                {isCameraActive && (
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                )}
              </button>
            </div>
          </div>

          {/* Honest Architecture Disclosure Callout */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.825rem',
            color: '#065f46'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#059669" />
              <span>
                <strong>Zero-Hardware Prototype Guarantee:</strong> Energy draw (kW) is <strong>SIMULATED</strong> from fixture ratings;
                Lab 1 CCTV occupancy is <strong>REAL</strong> from your edge camera. Frames stay in your browser.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#047857' }}>
              <Clock size={14} />
              <span>Demo speed: 1 sec = 1 min</span>
            </div>
          </div>
        </header>

        {/* Floating Calibration Toast when in Edit Mode */}
        {copiedCoordToast && (
          <div
            style={{
              background: '#db2777',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: '0 8px 20px rgba(219, 39, 119, 0.4)',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <Copy size={16} />
            <span>Copied to Clipboard: <code>{copiedCoordToast}</code></span>
          </div>
        )}

        {/* Main Grid: Left Floor Plan + Right Telemetry Cards */}
        <div className="twin-grid">
          {/* Left Column: Architectural Floor Plan View */}
          <section className="architectural-card" aria-label="Campus Architectural Floor Plan">
            {/* Layer Control Toolbar */}
            <div className="twin-layer-toolbar">
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', marginRight: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Layers size={14} color="#059669" />
                LAYERS:
              </span>

              {/* Plan Layer Toggle */}
              <button
                type="button"
                className={`twin-layer-pill ${layers.plan ? 'active' : ''}`}
                onClick={() => setLayers(l => ({ ...l, plan: !l.plan }))}
              >
                📐 Plan (Walls & Furniture)
              </button>

              {/* Energy Layer Toggle */}
              <button
                type="button"
                className={`twin-layer-pill ${layers.energy ? 'active' : ''}`}
                onClick={() => setLayers(l => ({ ...l, energy: !l.energy }))}
              >
                ⚡ Energy (Wash & Chips)
              </button>

              {/* Cameras Layer Toggle */}
              <button
                type="button"
                className={`twin-layer-pill ${layers.cameras ? 'active' : ''}`}
                onClick={() => setLayers(l => ({ ...l, cameras: !l.cameras }))}
              >
                📹 Cameras (CCTV FOV)
              </button>

              {/* People Layer Toggle */}
              <button
                type="button"
                className={`twin-layer-pill ${layers.people ? 'active' : ''}`}
                onClick={() => setLayers(l => ({ ...l, people: !l.people }))}
              >
                👥 People (Occupant Dots)
              </button>

              {/* Edit Mode Toggle */}
              <button
                type="button"
                className={`twin-layer-pill ${editMode ? 'edit-active' : ''}`}
                onClick={() => setEditMode(!editMode)}
                title="Click any point on the plan to copy x%, y% coordinates for tracing"
              >
                ✏️ {editMode ? 'Tracing Mode Active' : 'Edit / Trace Coordinates'}
              </button>
            </div>

            {/* Architectural SVG Plan Canvas */}
            <ArchitecturalPlanSvg
              rooms={rooms}
              selectedId={selectedId}
              onSelectRoom={(id) => {
                setSelectedId(id);
                if (id === 'room_1') {
                  setIsPipOpen(true);
                }
              }}
              layers={layers}
              editMode={editMode}
              onPlanClickCoordinate={handlePlanClickCoordinate}
              lab1Detections={rawDetections}
              isCameraActive={isCameraActive}
              onOpenPip={() => setIsPipOpen(true)}
            />

            {/* Floor Plan Legend */}
            <div className="twin-legend">
              <span>
                <i style={{ background: 'var(--twin-ok)' }}></i>
                <strong>Normal</strong> (Occupied / load off)
              </span>
              <span>
                <i style={{ background: 'var(--twin-warn)' }}></i>
                <strong>Empty, load still on</strong> (&lt; {leakThresholdSeconds}s)
              </span>
              <span>
                <i style={{ background: 'var(--twin-leak)' }}></i>
                <strong>Energy leak</strong> (Pulsing &ge; {leakThresholdSeconds}s)
              </span>
              <span>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7', marginRight: '4px', verticalAlign: '-1px' }}></span>
                <strong>Live Vision Dot</strong> (COCO-SSD person)
              </span>
            </div>
          </section>

          {/* Right Column: Telemetry, Room Inspector, Projections & Alerts */}
          <aside style={{ display: 'grid', gap: '1.25rem', alignContent: 'start' }}>
            {/* Card 1: Campus Now (Aggregated Metrics) */}
            <section className="twin-card">
              <h2>
                <span>Campus Operational Draw Now</span>
                <span className="pill pill-slate" style={{ fontSize: '0.725rem' }}>Block A</span>
              </h2>
              <div className="twin-stats">
                <div className="twin-stat-box">
                  <b id="sKw">{totalKw.toFixed(1)}</b>
                  <span>kW drawn now</span>
                </div>
                <div className="twin-stat-box">
                  <b id="sKwh">{totalKwh.toFixed(1)}</b>
                  <span>kWh cumulative</span>
                </div>
                <div className="twin-stat-box">
                  <b id="sCo2">{totalCo2Kg.toFixed(1)}</b>
                  <span>kg CO₂ emitted</span>
                </div>
                <div className="twin-stat-box">
                  <b id="sWaste" style={{ color: totalWasteKwh > 0 ? '#dc2626' : 'inherit' }}>
                    {totalWasteKwh.toFixed(1)}
                  </b>
                  <span>kWh wasted</span>
                </div>
                <div className="twin-stat-box">
                  <b id="sLeaks" style={{ color: activeLeaksCount > 0 ? '#dc2626' : '#059669' }}>
                    {activeLeaksCount}
                  </b>
                  <span>active energy leaks</span>
                </div>
              </div>
              <p style={{ margin: '0.65rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Emission factor: 0.71 kg CO₂/kWh • Tariff: ₹8.00/kWh • Demo clock: 1 sec = 1 min
              </p>
            </section>

            {/* Card 2: Room Control & Leak Simulator */}
            <section className="twin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 id="selName" style={{ margin: 0 }}>
                  {selectedRoom.name}
                </h2>
                <span className={`pill ${selectedRoom.status === 'leak' ? 'pill-rose' : selectedRoom.status === 'warn' ? 'pill-amber' : 'pill-emerald'}`}>
                  {TWIN_CONFIG.STATUS_LABELS[selectedRoom.status]}
                </span>
              </div>

              <p id="selInfo" style={{ margin: '0.5rem 0 0.75rem', fontSize: '0.825rem', color: '#475569' }}>
                <strong>Telemetry:</strong> {selectedRoom.people} {selectedRoom.people === 1 ? 'person' : 'occupants'}, {selectedRoom.kw.toFixed(2)} kW active load.
                HVAC/AC is <strong>{selectedRoom.ac ? 'ON (1.8 kW)' : 'OFF'}</strong>, Lighting is <strong>{selectedRoom.lights ? 'ON (0.4 kW)' : 'OFF'}</strong>.
                {selectedRoom.idle > 0 && (
                  <span style={{ color: selectedRoom.status === 'leak' ? '#dc2626' : '#b45309', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
                    ⚠️ Idle timer: {selectedRoom.idle}s / {leakThresholdSeconds}s limit
                  </span>
                )}
              </p>

              {/* Interactive Control Buttons */}
              <div className="twin-btn-row">
                <button
                  id="bAc"
                  onClick={handleToggleAc}
                  className="twin-btn"
                  title="Toggle AC load on/off"
                >
                  <Power size={14} color={selectedRoom.ac ? '#059669' : '#64748b'} />
                  Toggle AC ({selectedRoom.ac ? 'ON' : 'OFF'})
                </button>

                <button
                  onClick={handleToggleLights}
                  className="twin-btn"
                  title="Toggle Lights on/off"
                >
                  <Zap size={14} color={selectedRoom.lights ? '#f59e0b' : '#64748b'} />
                  Toggle Lights ({selectedRoom.lights ? 'ON' : 'OFF'})
                </button>

                <button
                  id="bLeak"
                  onClick={handleTriggerForgetLeak}
                  className="twin-btn danger"
                  title="Simulate someone leaving room with equipment left running"
                >
                  <AlertTriangle size={14} />
                  Leave AC on in empty room
                </button>

                <button
                  id="bFix"
                  onClick={handleFixRoom}
                  className="twin-btn pri"
                  title="Run automated cutoff to stop energy waste"
                >
                  <CheckCircle2 size={14} />
                  Switch off AC and lights
                </button>
              </div>

              {/* Leak Threshold Slider */}
              <label className="twin-label" htmlFor="leakS">
                Flag a leak after <b id="leakV">{leakThresholdSeconds}</b> s empty with load on
                <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '0.35rem' }}>
                  (use 15 min / 900s in real life)
                </span>
                <input
                  id="leakS"
                  className="twin-slider"
                  type="range"
                  min="5"
                  max="60"
                  value={leakThresholdSeconds}
                  onChange={(e) => setLeakThresholdSeconds(Number(e.target.value))}
                />
              </label>
            </section>

            {/* Card 3: Camera PiP Launcher & Fallback Simulator */}
            <section className="twin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>
                  <span>Lab 1 CCTV Vision (CAM-01)</span>
                  <span className="pill pill-slate" style={{ fontSize: '0.725rem' }}>Zero PII</span>
                </h2>
                <button
                  onClick={() => setIsPipOpen(true)}
                  className="twin-btn"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem' }}
                >
                  <ExternalLink size={12} />
                  Open PiP
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {!isCameraActive ? (
                  <button
                    id="cam"
                    onClick={() => {
                      startCamera();
                      setIsPipOpen(true);
                    }}
                    disabled={isModelLoading}
                    className="twin-btn pri"
                  >
                    {isModelLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Loading TensorFlow COCO-SSD...
                      </>
                    ) : (
                      <>
                        <Camera size={14} />
                        Start Camera (Local In-Browser)
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="twin-btn danger"
                  >
                    <EyeOff size={14} />
                    Stop Camera
                  </button>
                )}

                <button
                  id="btn-simulate-cam"
                  onClick={() => {
                    if (isCameraActive) stopCamera();
                    setSimulatedCameraMode(!simulatedCameraMode);
                  }}
                  className={`twin-btn ${simulatedCameraMode ? 'pri' : ''}`}
                  style={{ background: simulatedCameraMode ? '#059669' : '#f1f5f9' }}
                >
                  <Video size={14} />
                  {simulatedCameraMode ? 'Simulate Camera (Active)' : 'Simulate Camera (Fallback)'}
                </button>
              </div>

              {/* Offscreen Canvas for luminance analysis */}
              <canvas ref={canvasRef} width="32" height="24" style={{ display: 'none' }} />

              {/* Simulated Camera Controls Fallback */}
              {simulatedCameraMode && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#166534', marginBottom: '0.35rem' }}>
                    Camera Simulation Controls (No Webcam Needed):
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.8rem', color: '#14532d', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Occupants in Lab 1:
                      <select
                        id="sim-people-select"
                        value={simulatedPeopleCount}
                        onChange={(e) => setSimulatedPeopleCount(Number(e.target.value))}
                        style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #86efac' }}
                      >
                        <option value="0">0 (Empty - trigger leak)</option>
                        <option value="1">1 person</option>
                        <option value="2">2 people</option>
                        <option value="4">4 people</option>
                      </select>
                    </label>

                    <label style={{ fontSize: '0.8rem', color: '#14532d', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="checkbox"
                        checked={simulatedLightsOn}
                        onChange={(e) => setSimulatedLightsOn(e.target.checked)}
                      />
                      Lights turned ON
                    </label>
                  </div>
                </div>
              )}

              {/* Luminance status */}
              <div style={{ marginTop: '0.75rem' }}>
                <p id="bright" className="small" style={{ margin: '0 0 0.35rem', fontSize: '0.775rem', color: '#475569' }}>
                  {currentBrightness !== null ? (
                    <>
                      Luminance: <strong>{currentBrightness}</strong> (lights count as ON above threshold <strong>{lightThreshold}</strong>).
                      Detected: <strong>{rooms[0].lights ? 'LIGHTS ON' : 'LIGHTS OFF'}</strong>.
                    </>
                  ) : (
                    <>Click Lab 1 or the LIVE badge to open Picture-in-Picture with real-time COCO-SSD bounding boxes.</>
                  )}
                </p>

                <label className="twin-label" style={{ marginTop: '0.35rem' }} htmlFor="lightT">
                  Light detection sensitivity threshold: <b>{lightThreshold}</b>
                  <input
                    id="lightT"
                    className="twin-slider"
                    type="range"
                    min="30"
                    max="140"
                    value={lightThreshold}
                    onChange={(e) => setLightThreshold(Number(e.target.value))}
                  />
                </label>
              </div>

              {cameraError && (
                <p id="msg" role="alert" style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0.65rem 0 0', fontWeight: 500 }}>
                  {cameraError}
                </p>
              )}
            </section>

            {/* Card 4: What-If Scenario Projection */}
            <section className="twin-card">
              <h2>
                <span>What If Leaks Went Unfixed?</span>
                <span className="pill pill-slate" style={{ fontSize: '0.725rem' }}>Monthly ROI</span>
              </h2>

              <label className="twin-label" htmlFor="idleH">
                Idle wasted hours per day: <b id="idleV">{idleHours}</b> hours
                <input
                  id="idleH"
                  className="twin-slider"
                  type="range"
                  min="0"
                  max="12"
                  value={idleHours}
                  onChange={(e) => setIdleHours(Number(e.target.value))}
                />
              </label>

              <div style={{
                marginTop: '0.85rem',
                padding: '0.85rem',
                borderRadius: '8px',
                background: totalIdleKw > 0 ? '#fffbeb' : '#f8fafc',
                border: totalIdleKw > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
                fontSize: '0.825rem',
                lineHeight: 1.5,
                color: totalIdleKw > 0 ? '#92400e' : '#64748b'
              }}>
                <p id="whatif" style={{ margin: 0 }}>
                  {totalIdleKw > 0 ? (
                    <>
                      Current idle load of <strong>{totalIdleKw.toFixed(1)} kW</strong> across unoccupied rooms for{' '}
                      <strong>{idleHours} hours/day</strong> wastes approximately{' '}
                      <strong>{whatIfMonthlyKwh.toFixed(0)} kWh</strong>,{' '}
                      <strong>{whatIfMonthlyCo2.toFixed(0)} kg CO₂</strong>, and{' '}
                      <strong>₹{whatIfMonthlyCost.toFixed(0)}</strong> every month.
                      An automated policy or occupancy-driven cutoff will recover 100% of this waste.
                    </>
                  ) : (
                    <>No idle load detected right now. Click "Leave AC on in empty room" above to trigger a leak and see financial projection.</>
                  )}
                </p>
              </div>
            </section>

            {/* Card 5: Real-time Anomaly & Audit Log */}
            <section className="twin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>
                  <span>Real-Time Audit & Leak Alerts</span>
                </h2>
                {alerts.length > 1 && (
                  <button
                    onClick={() => setAlerts([alerts[0]])}
                    className="twin-btn"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                  >
                    Clear log
                  </button>
                )}
              </div>

              <ol id="log" className="twin-alerts-list">
                {alerts.map((alert) => (
                  <li key={alert.id} className="twin-alert-item">
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <span style={{ fontSize: '0.725rem', opacity: 0.85, marginRight: '0.35rem', fontFamily: 'monospace' }}>
                        [{alert.time}]
                      </span>
                      <span>{alert.text}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </div>

      {/* Picture-in-Picture Live Video Modal */}
      <CameraPipModal
        isOpen={isPipOpen}
        onClose={() => setIsPipOpen(false)}
        isCameraActive={isCameraActive}
        isModelLoading={isModelLoading}
        cameraDevices={cameraDevices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={(devId) => {
          setSelectedDeviceId(devId);
          if (isCameraActive) {
            stopCamera();
            setTimeout(() => startCamera(devId), 300);
          }
        }}
        onStartCamera={() => startCamera(selectedDeviceId)}
        onStopCamera={stopCamera}
        simulatedCameraMode={simulatedCameraMode}
        onToggleSimulateCamera={() => {
          if (isCameraActive) stopCamera();
          setSimulatedCameraMode(!simulatedCameraMode);
        }}
        simulatedPeopleCount={simulatedPeopleCount}
        onChangeSimulatedPeople={setSimulatedPeopleCount}
        simulatedLightsOn={simulatedLightsOn}
        onToggleSimulatedLights={setSimulatedLightsOn}
        currentBrightness={currentBrightness}
        lightThreshold={lightThreshold}
        onChangeLightThreshold={setLightThreshold}
        cameraError={cameraError}
        videoRef={videoRef}
        overlayCanvasRef={overlayCanvasRef}
        detections={rawDetections}
        lab1Telemetry={rooms[0]}
      />
    </div>
  );
}
