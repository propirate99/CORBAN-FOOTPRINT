import { CameraState } from './types';
import { CAMERA_CONFIG } from './config';

export class CameraController {
  private activeStream: MediaStream | null = null;
  private currentOperationToken: number = 0;
  private currentFacingMode: 'user' | 'environment' = 'user';
  private onStateChange: (state: CameraState, error?: string) => void;

  constructor(onStateChange: (state: CameraState, error?: string) => void) {
    this.onStateChange = onStateChange;
  }

  get stream(): MediaStream | null {
    return this.activeStream;
  }

  get facingMode(): 'user' | 'environment' {
    return this.currentFacingMode;
  }

  async startCamera(
    videoElement: HTMLVideoElement,
    facingMode: 'user' | 'environment' = 'user'
  ): Promise<boolean> {
    // Check for Secure Context (HTTPS or localhost)
    if (!window.isSecureContext) {
      this.onStateChange('ERROR', 'Camera access requires a secure context (HTTPS or localhost).');
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onStateChange('ERROR', 'MediaDevices API is not supported in this browser.');
      return false;
    }

    this.currentFacingMode = facingMode;
    const operationToken = ++this.currentOperationToken;
    this.onStateChange('REQUESTING_PERMISSION');

    try {
      // Audio is strictly set to false
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          width: { ideal: CAMERA_CONFIG.video.idealWidth },
          height: { ideal: CAMERA_CONFIG.video.idealHeight },
          facingMode: { ideal: facingMode },
        },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        } else {
          throw err;
        }
      }

      // Race condition check: if user clicked Stop while getUserMedia was resolving
      if (operationToken !== this.currentOperationToken) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      // Stop previous stream if any
      this.stopActiveTracks();
      this.activeStream = stream;

      this.onStateChange('STARTING');
      videoElement.srcObject = stream;

      // Wait for video to have valid nonzero dimensions
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => {
          videoElement.removeEventListener('loadedmetadata', onLoaded);
          videoElement.removeEventListener('error', onError);
          resolve();
        };
        const onError = (e: Event) => {
          videoElement.removeEventListener('loadedmetadata', onLoaded);
          videoElement.removeEventListener('error', onError);
          reject(e);
        };

        if (videoElement.readyState >= 1 && videoElement.videoWidth > 0) {
          resolve();
        } else {
          videoElement.addEventListener('loadedmetadata', onLoaded);
          videoElement.addEventListener('error', onError);
        }
      });

      await videoElement.play();

      if (operationToken !== this.currentOperationToken) {
        this.stopCamera(videoElement);
        return false;
      }

      this.onStateChange('RUNNING');
      return true;
    } catch (err: any) {
      if (operationToken !== this.currentOperationToken) {
        return false;
      }

      let userMessage = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userMessage = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userMessage = 'Camera is currently busy or being used by another application.';
      } else if (err.name === 'OverconstrainedError') {
        userMessage = 'Requested camera resolution/mode is not supported by this device.';
      }

      this.onStateChange('ERROR', userMessage);
      return false;
    }
  }

  async switchCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    const nextMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    this.stopActiveTracks();
    videoElement.srcObject = null;
    return this.startCamera(videoElement, nextMode);
  }

  stopCamera(videoElement?: HTMLVideoElement | null) {
    this.currentOperationToken++; // Invalidate pending operations
    this.stopActiveTracks();
    if (videoElement) {
      videoElement.srcObject = null;
    }
    this.onStateChange('STOPPED');
  }

  private stopActiveTracks() {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore already stopped tracks
        }
      });
      this.activeStream = null;
    }
  }
}
