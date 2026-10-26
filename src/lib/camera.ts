/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderCompositedFrame } from './filters';

export interface CameraState {
  stream: MediaStream | null;
  audioStream: MediaStream | null;
  facingMode: 'user' | 'environment';
  hasTorch: boolean;
  isTorchOn: boolean;
  error: string | null;
}

export class CameraService {
  private activeVideoStream: MediaStream | null = null;
  private activeAudioStream: MediaStream | null = null;
  private currentFacingMode: 'user' | 'environment' = 'user';
  private torchSupported = false;
  private isTorchActive = false;

  public async startCamera(
    facingMode: 'user' | 'environment' = 'user',
    includeAudio = false
  ): Promise<{ videoStream: MediaStream; audioStream: MediaStream | null; hasTorch: boolean }> {
    this.stopAll();
    this.currentFacingMode = facingMode;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.activeVideoStream = videoStream;

      // Check for torch capability
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
        const capabilities = videoTrack.getCapabilities() as { torch?: boolean };
        this.torchSupported = !!capabilities.torch;
      } else {
        this.torchSupported = false;
      }

      let audioStream: MediaStream | null = null;
      if (includeAudio) {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.activeAudioStream = audioStream;
        } catch (err) {
          console.warn('Microphone permission not granted or audio unavailable', err);
        }
      }

      return {
        videoStream,
        audioStream,
        hasTorch: this.torchSupported,
      };
    } catch (err: unknown) {
      const error = err as Error;
      let readableMessage = 'Failed to open camera.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        readableMessage = 'Camera permission was denied. Please allow camera access in your browser settings to take photos and videos.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        readableMessage = 'No compatible camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        readableMessage = 'Camera is already in use by another application or tab.';
      } else if (error.name === 'OverconstrainedError') {
        readableMessage = 'Your device camera does not support the requested camera mode. Switching to default...';
      }
      throw new Error(readableMessage);
    }
  }

  public async toggleTorch(enabled: boolean): Promise<boolean> {
    if (!this.torchSupported || !this.activeVideoStream) return false;
    const videoTrack = this.activeVideoStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: enabled } as MediaTrackConstraintSet],
      });
      this.isTorchActive = enabled;
      return enabled;
    } catch (err) {
      console.warn('Could not toggle torch:', err);
      return false;
    }
  }

  public stopAll(): void {
    if (this.activeVideoStream) {
      this.activeVideoStream.getTracks().forEach((track) => track.stop());
      this.activeVideoStream = null;
    }
    if (this.activeAudioStream) {
      this.activeAudioStream.getTracks().forEach((track) => track.stop());
      this.activeAudioStream = null;
    }
    this.isTorchActive = false;
    this.torchSupported = false;
  }

  /**
   * Captures a single photo from a video element, baking in the selected filter & overlay!
   */
  public capturePhotoWithEffects(
    videoElement: HTMLVideoElement,
    filterId: string,
    overlayId: string,
    isMirrored = false
  ): { dataUrl: string; blob: Promise<Blob> } {
    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    renderCompositedFrame(ctx, videoElement, width, height, filterId, overlayId, isMirrored);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const blobPromise = new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate image Blob'));
        },
        'image/jpeg',
        0.92
      );
    });

    return { dataUrl, blob: blobPromise };
  }

  /**
   * Starts recording video with live canvas compositing so filters and overlays are baked into the video recording!
   */
  public startVideoRecording(
    videoElement: HTMLVideoElement,
    filterId: string,
    overlayId: string,
    isMirrored = false,
    audioStream: MediaStream | null = null
  ): {
    stop: () => Promise<{ blob: Blob; url: string; mimeType: string }>;
    cancel: () => void;
  } {
    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    let isRunning = true;
    let animId: number;

    const drawLoop = () => {
      if (!isRunning) return;
      renderCompositedFrame(ctx, videoElement, width, height, filterId, overlayId, isMirrored);
      animId = requestAnimationFrame(drawLoop);
    };
    animId = requestAnimationFrame(drawLoop);

    // Capture stream from canvas at 30fps
    const canvasStream = canvas.captureStream(30);

    // Combine canvas video track + microphone audio track if available
    const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    if (audioStream) {
      const audioTracks = audioStream.getAudioTracks();
      if (audioTracks.length > 0) {
        combinedTracks.push(audioTracks[0]);
      }
    }

    const recordStream = new MediaStream(combinedTracks);

    // Determine supported mime type
    let mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else {
        mimeType = '';
      }
    }

    const recorder = mimeType
      ? new MediaRecorder(recordStream, { mimeType })
      : new MediaRecorder(recordStream);

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.start(100);

    return {
      stop: () => {
        return new Promise((resolve) => {
          isRunning = false;
          cancelAnimationFrame(animId);

          recorder.onstop = () => {
            const finalType = recorder.mimeType || 'video/webm';
            const blob = new Blob(chunks, { type: finalType });
            const url = URL.createObjectURL(blob);
            resolve({ blob, url, mimeType: finalType });
          };

          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        });
      },
      cancel: () => {
        isRunning = false;
        cancelAnimationFrame(animId);
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      },
    };
  }
}

export const cameraService = new CameraService();
