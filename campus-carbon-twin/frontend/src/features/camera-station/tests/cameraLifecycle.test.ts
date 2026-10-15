import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CameraController } from '../cameraController';

describe('CameraController Lifecycle Tests', () => {
  let mockTracks: any[];
  let mockStream: any;
  let mockVideo: any;

  beforeEach(() => {
    mockTracks = [
      { stop: vi.fn(), kind: 'video', enabled: true },
    ];
    mockStream = {
      getTracks: vi.fn().mockReturnValue(mockTracks),
    };
    mockVideo = {
      srcObject: null,
      readyState: 4,
      videoWidth: 640,
      videoHeight: 480,
      play: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Polyfill window.isSecureContext and navigator.mediaDevices for node environment
    if (typeof (globalThis as any).window === 'undefined') {
      (globalThis as any).window = globalThis;
    }
    if (typeof (globalThis as any).navigator === 'undefined') {
      (globalThis as any).navigator = {} as any;
    }
    (globalThis as any).window.isSecureContext = true;
    (globalThis as any).navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    };
  });

  it('stops all media tracks and detaches video srcObject on stopCamera()', async () => {
    const states: string[] = [];
    const controller = new CameraController((st) => states.push(st));

    const started = await controller.startCamera(mockVideo, 'user');
    expect(started).toBe(true);
    expect(mockVideo.srcObject).toBe(mockStream);
    expect(states).toContain('RUNNING');

    controller.stopCamera(mockVideo);

    expect(mockTracks[0].stop).toHaveBeenCalled();
    expect(mockVideo.srcObject).toBeNull();
    expect(controller.stream).toBeNull();
    expect(states[states.length - 1]).toBe('STOPPED');
  });

  it('immediately stops late-arriving stream if user clicked stop while permission was resolving', async () => {
    let resolveMedia: any;
    const pendingPromise = new Promise((resolve) => {
      resolveMedia = resolve;
    });

    navigator.mediaDevices.getUserMedia = vi.fn().mockReturnValue(pendingPromise);

    const states: string[] = [];
    const controller = new CameraController((st) => states.push(st));

    // User clicks Start
    const startPromise = controller.startCamera(mockVideo, 'user');

    // While permission is pending, user immediately clicks Stop
    controller.stopCamera(mockVideo);

    // Permission resolves later
    resolveMedia(mockStream);
    const startResult = await startPromise;

    // Operation was cancelled: start returns false, late-arriving stream tracks are stopped
    expect(startResult).toBe(false);
    expect(mockTracks[0].stop).toHaveBeenCalled();
    expect(mockVideo.srcObject).toBeNull();
  });

  it('switches front and rear cameras safely by stopping prior tracks first', async () => {
    const controller = new CameraController(() => {});
    await controller.startCamera(mockVideo, 'user');
    expect(controller.facingMode).toBe('user');

    // Switch to environment
    const secondTracks = [{ stop: vi.fn() }];
    const secondStream = { getTracks: () => secondTracks };
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(secondStream);

    await controller.switchCamera(mockVideo);

    // Prior track was stopped
    expect(mockTracks[0].stop).toHaveBeenCalled();
    expect(controller.facingMode).toBe('environment');
  });
});
