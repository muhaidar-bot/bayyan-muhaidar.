/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Clock,
  Send,
  RotateCcw,
  Download,
  Upload,
  AlertCircle,
  Video,
  Circle,
  Square,
  Sparkles,
} from 'lucide-react';
import { CAMERA_FILTERS, DECORATIVE_OVERLAYS } from '../lib/filters';
import { cameraService } from '../lib/camera';
import confetti from 'canvas-confetti';

interface CameraViewProps {
  onSendMediaToChat: (blob: Blob, mediaType: 'image' | 'video', caption?: string) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onSendMediaToChat, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera settings state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState('original');
  const [activeOverlayId, setActiveOverlayId] = useState('none');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownVal, setCountdownVal] = useState<number>(0);

  // Capture mode: 'photo' | 'video'
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRecorderRef = useRef<{ stop: () => Promise<{ blob: Blob; url: string; mimeType: string }>; cancel: () => void } | null>(null);

  // Status & error states
  const [cameraLoading, setCameraLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Captured media preview state
  const [capturedMedia, setCapturedMedia] = useState<{
    url: string;
    blob: Blob;
    type: 'image' | 'video';
  } | null>(null);
  const [caption, setCaption] = useState('');

  // Animation frame loop for real-time live canvas rendering
  const animFrameRef = useRef<number | null>(null);

  // Initialize and start camera
  const initCamera = useCallback(async () => {
    setCameraLoading(true);
    setPermissionError(null);
    try {
      const { videoStream, hasTorch: torchAvail } = await cameraService.startCamera(
        facingMode,
        mode === 'video'
      );
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
        await videoRef.current.play();
      }
      setHasTorch(torchAvail);
      setIsTorchOn(false);
      setCameraLoading(false);
    } catch (err: unknown) {
      const error = err as Error;
      setPermissionError(error.message);
      setCameraLoading(false);
    }
  }, [facingMode, mode]);

  useEffect(() => {
    initCamera();
    return () => {
      // Stop all streams when unmounting or leaving camera
      cameraService.stopAll();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [initCamera]);

  // Live Canvas Rendering with Selected Filter & Selected Animated Overlay
  useEffect(() => {
    let active = true;

    const renderLoop = () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.clearRect(0, 0, width, height);

          // Mirror if front camera
          if (facingMode === 'user') {
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
          }

          // Apply active filter CSS emulation
          const filter = CAMERA_FILTERS.find((f) => f.id === activeFilterId) || CAMERA_FILTERS[0];
          ctx.filter = filter.cssFilter || 'none';
          ctx.drawImage(video, 0, 0, width, height);
          ctx.filter = 'none';

          // Apply color tint
          if (filter.colorGrade && filter.colorGrade !== 'rgba(0,0,0,0)') {
            ctx.fillStyle = filter.colorGrade;
            ctx.fillRect(0, 0, width, height);
          }
          ctx.restore();

          // Overlay drawing
          const overlay = DECORATIVE_OVERLAYS.find((o) => o.id === activeOverlayId);
          if (overlay && overlay.id !== 'none') {
            overlay.draw(ctx, width, height, Date.now());
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeFilterId, activeOverlayId, facingMode]);

  // Toggle Camera Front / Back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Toggle Torch / Flashlight
  const handleToggleTorch = async () => {
    const nextState = !isTorchOn;
    const success = await cameraService.toggleTorch(nextState);
    if (success) setIsTorchOn(nextState);
  };

  // Shutter action (Photo capture with effects)
  const executePhotoCapture = async () => {
    if (!videoRef.current) return;
    try {
      const { dataUrl, blob: blobPromise } = cameraService.capturePhotoWithEffects(
        videoRef.current,
        activeFilterId,
        activeOverlayId,
        facingMode === 'user'
      );
      const blob = await blobPromise;
      setCapturedMedia({
        url: dataUrl,
        blob,
        type: 'image',
      });
      // Romantic celebratory sparkle
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f43f5e', '#ec4899', '#fda4af'],
      });
    } catch (err) {
      console.error('Capture photo error:', err);
    }
  };

  // Trigger shutter with timer countdown
  const handleShutter = () => {
    if (isCountingDown || isRecording) return;

    if (timerSeconds > 0) {
      setIsCountingDown(true);
      setCountdownVal(timerSeconds);

      let current = timerSeconds;
      const interval = setInterval(() => {
        current -= 1;
        if (current <= 0) {
          clearInterval(interval);
          setIsCountingDown(false);
          if (mode === 'photo') {
            executePhotoCapture();
          } else {
            startVideoRecording();
          }
        } else {
          setCountdownVal(current);
        }
      }, 1000);
    } else {
      if (mode === 'photo') {
        executePhotoCapture();
      } else {
        startVideoRecording();
      }
    }
  };

  // Start Video Recording with baked filters and overlays
  const startVideoRecording = async () => {
    if (!videoRef.current) return;
    try {
      setIsRecording(true);
      setRecordSeconds(0);

      const recorder = cameraService.startVideoRecording(
        videoRef.current,
        activeFilterId,
        activeOverlayId,
        facingMode === 'user'
      );
      activeRecorderRef.current = recorder;

      recordingTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Video recording error:', err);
      setIsRecording(false);
    }
  };

  // Stop Video Recording
  const stopVideoRecording = async () => {
    if (!activeRecorderRef.current) return;
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    try {
      const { blob, url } = await activeRecorderRef.current.stop();
      activeRecorderRef.current = null;
      setCapturedMedia({
        url,
        blob,
        type: 'video',
      });
    } catch (err) {
      console.error('Error stopping recorder:', err);
    }
  };

  // Import media from device gallery
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      alert('Please upload a valid image or video file.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCapturedMedia({
      url: objectUrl,
      blob: file,
      type: isVideo ? 'video' : 'image',
    });
  };

  // Send captured media to chat
  const handleSendToChat = () => {
    if (!capturedMedia) return;
    onSendMediaToChat(capturedMedia.blob, capturedMedia.type, caption);
    setCapturedMedia(null);
    setCaption('');
  };

  // Retake captured media
  const handleRetake = () => {
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.url);
      setCapturedMedia(null);
      setCaption('');
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] max-w-4xl mx-auto flex flex-col bg-black text-rose-50 overflow-hidden md:rounded-3xl md:my-2 md:border md:border-rose-950/60 shadow-2xl">
      {/* Hidden raw video element used as canvas source */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* Post-Capture Review Screen */}
      {capturedMedia ? (
        <div className="relative flex-1 flex flex-col bg-[#140517] overflow-hidden">
          {/* Media Preview Box */}
          <div className="relative flex-1 flex items-center justify-center p-3 bg-black">
            {capturedMedia.type === 'image' ? (
              <img
                src={capturedMedia.url}
                alt="Captured romantic moment"
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl border border-rose-950/40"
              />
            ) : (
              <video
                src={capturedMedia.url}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl border border-rose-950/40"
              />
            )}
          </div>

          {/* Action Bar & Caption */}
          <div className="p-4 bg-[#1a0720] border-t border-rose-950/60 space-y-3">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a romantic note for Bayyan & Muhaidar..."
              className="w-full py-2.5 px-4 rounded-xl bg-black/40 border border-rose-900/40 text-sm text-rose-100 placeholder-rose-300/40 focus:outline-none focus:border-rose-500 transition-colors"
            />

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={capturedMedia.url}
                  download={`bayyan_muhaidar_${Date.now()}.${capturedMedia.type === 'image' ? 'jpg' : 'webm'}`}
                  className="w-10 h-10 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 flex items-center justify-center transition-colors"
                  title="Download to device"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={handleSendToChat}
                  className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-900/50 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Camera Viewfinder & Controls */
        <div className="relative flex-1 flex flex-col bg-black overflow-hidden">
          {/* Top Controls Strip */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {/* Flash/Torch button if supported */}
            <div className="flex items-center gap-2">
              {hasTorch && (
                <button
                  onClick={handleToggleTorch}
                  aria-label="Toggle Torch"
                  className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                    isTorchOn
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/50'
                      : 'bg-black/40 text-white/80 hover:bg-black/60'
                  }`}
                >
                  {isTorchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </button>
              )}

              {/* Timer selector */}
              <button
                onClick={() =>
                  setTimerSeconds((prev) => (prev === 0 ? 3 : prev === 3 ? 5 : prev === 5 ? 10 : 0))
                }
                aria-label="Camera timer countdown"
                className={`min-h-[44px] min-w-[44px] px-2.5 rounded-full flex items-center justify-center gap-1 backdrop-blur-md text-xs font-semibold transition-colors ${
                  timerSeconds > 0
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                    : 'bg-black/40 text-white/80 hover:bg-black/60'
                }`}
              >
                <Clock className="w-4 h-4" />
                {timerSeconds > 0 && <span>{timerSeconds}s</span>}
              </button>
            </div>

            {/* Mode switch (Photo / Video) */}
            <div className="flex items-center bg-black/50 backdrop-blur-md rounded-full p-1 border border-white/10">
              <button
                onClick={() => setMode('photo')}
                className={`py-1 px-3 rounded-full text-xs font-medium transition-colors ${
                  mode === 'photo'
                    ? 'bg-rose-600 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Photo
              </button>
              <button
                onClick={() => setMode('video')}
                className={`py-1 px-3 rounded-full text-xs font-medium transition-colors ${
                  mode === 'video'
                    ? 'bg-rose-600 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Video
              </button>
            </div>

            {/* Flip camera front/back */}
            <button
              onClick={handleFlipCamera}
              aria-label="Flip Camera"
              className="min-h-[44px] min-w-[44px] rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/60 flex items-center justify-center transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Center Canvas Viewfinder */}
          <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
            {cameraLoading ? (
              <div className="flex flex-col items-center gap-3 text-rose-300">
                <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Opening camera...</span>
              </div>
            ) : permissionError ? (
              <div className="p-6 max-w-sm text-center bg-rose-950/40 border border-rose-900/60 rounded-2xl mx-4">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-rose-100">Camera Permission Needed</h3>
                <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                  {permissionError}
                </p>
                <button
                  onClick={initCamera}
                  className="mt-4 py-2 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-xs font-medium text-white transition-colors"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
              />
            )}

            {/* Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
                <span className="text-8xl font-serif font-bold text-rose-400 animate-ping">
                  {countdownVal}
                </span>
              </div>
            )}

            {/* Recording Timer Badge */}
            {isRecording && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 py-1 px-3.5 rounded-full bg-red-600/90 text-white text-xs font-bold tracking-wider animate-pulse shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                <span>
                  {Math.floor(recordSeconds / 60)}:
                  {(recordSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Overlays selector strip */}
          <div className="relative z-20 px-3 py-1.5 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] text-rose-300/60 uppercase font-medium pl-1 pr-2 shrink-0">
                Overlays:
              </span>
              {DECORATIVE_OVERLAYS.map((overlay) => (
                <button
                  key={overlay.id}
                  onClick={() => setActiveOverlayId(overlay.id)}
                  className={`min-h-[36px] px-3 rounded-full flex items-center gap-1.5 text-xs transition-all shrink-0 ${
                    activeOverlayId === overlay.id
                      ? 'bg-rose-600 text-white font-semibold shadow-md shadow-rose-900/60'
                      : 'bg-white/10 text-rose-100 hover:bg-white/20'
                  }`}
                >
                  <span>{overlay.icon}</span>
                  <span className="text-[11px]">{overlay.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Carousel Strip (Page 3 of Specification) */}
          <div className="relative z-20 px-3 pb-2 bg-black">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
              {CAMERA_FILTERS.map((f) => {
                const isSelected = activeFilterId === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilterId(f.id)}
                    className={`flex flex-col items-center gap-1 min-w-[70px] transition-transform ${
                      isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all shadow-md ${
                        isSelected
                          ? 'border-rose-400 ring-2 ring-rose-500/50 shadow-rose-600/30'
                          : 'border-white/20'
                      }`}
                      style={{
                        background:
                          f.id === 'original'
                            ? '#2b1029'
                            : f.colorGrade !== 'rgba(0,0,0,0)'
                            ? f.colorGrade
                            : '#44143a',
                      }}
                    >
                      <Sparkles
                        className={`w-4 h-4 ${
                          isSelected ? 'text-rose-300' : 'text-white/60'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] whitespace-nowrap ${
                        isSelected ? 'text-rose-200 font-semibold' : 'text-white/60'
                      }`}
                    >
                      {f.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Shutter & Gallery Strip */}
          <div className="relative z-20 flex items-center justify-around py-4 px-6 bg-black border-t border-white/10">
            {/* Gallery picker */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Import from gallery"
              className="min-h-[48px] min-w-[48px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <Upload className="w-5 h-5 text-rose-300" />
            </button>

            {/* Shutter Button */}
            {mode === 'photo' ? (
              <button
                onClick={handleShutter}
                aria-label="Take Photo"
                className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-95 transition-transform"
              >
                <div className="w-full h-full rounded-full bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/50" />
              </button>
            ) : (
              <button
                onClick={isRecording ? stopVideoRecording : handleShutter}
                aria-label={isRecording ? 'Stop Recording' : 'Record Video'}
                className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-95 transition-transform"
              >
                <div
                  className={`w-full h-full transition-all flex items-center justify-center ${
                    isRecording
                      ? 'rounded-lg bg-red-600 scale-75'
                      : 'rounded-full bg-red-600 shadow-lg shadow-red-600/50'
                  }`}
                >
                  {isRecording ? <Square className="w-5 h-5 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </div>
              </button>
            )}

            {/* Close Camera button */}
            <button
              onClick={onClose}
              aria-label="Back to chat"
              className="min-h-[48px] min-w-[48px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <span className="text-xs font-semibold text-rose-200">Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
