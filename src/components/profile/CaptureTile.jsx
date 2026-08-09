import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Loader2, Check, X, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * PV-001 — Front-camera capture tile for photo verification.
 * Prefers getUserMedia({ facingMode: 'user' }) for a live view + capture.
 * Falls back to <input accept="image/*" capture="user"> for WebViews where
 * getUserMedia is unsupported or permission is denied.
 * Shows preview + Retake after capture. No gallery uploads.
 */
export default function CaptureTile({ label, previewUrl, uploading, onCapture, onRetake }) {
  const [mode, setMode] = useState('idle'); // idle | camera | error
  const [errorMsg, setErrorMsg] = useState('');
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setMode('idle');
  }, [stream]);

  const startCamera = useCallback(async () => {
    setErrorMsg('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera not supported. Use your camera app instead.');
      setMode('error');
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(s);
      setMode('camera');
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = s;
      });
    } catch (err) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setErrorMsg('Camera permission denied. Use your camera app instead.');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setErrorMsg('No camera found. Use your camera app instead.');
      } else {
        setErrorMsg('Camera unavailable. Use your camera app instead.');
      }
      setMode('error');
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
      stopCamera();
    }, 'image/jpeg', 0.9);
  }, [onCapture, stopCamera]);

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
    e.target.value = '';
    setMode('idle');
  };

  useEffect(() => () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }, [stream]);

  return (
    <div className="relative">
      {/* Preview */}
      {previewUrl ? (
        <div className="relative rounded-xl border-2 border-success/50 bg-success/5 h-36 overflow-hidden">
          <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1 drop-shadow">
              <Check className="w-3.5 h-3.5" /> {label}
            </span>
            <button
              type="button"
              onClick={onRetake}
              className="flex items-center gap-1 text-xs font-medium text-white bg-black/50 rounded-full px-2.5 py-1 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-3 h-3" /> Retake
            </button>
          </div>
        </div>
      ) : mode === 'camera' ? (
        /* Camera live view */
        <div className="relative rounded-xl border-2 border-primary bg-black h-36 overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={captureFrame}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-primary shadow-lg active:scale-90 transition-transform"
          />
          <button
            type="button"
            onClick={stopCamera}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : mode === 'error' ? (
        /* Error state */
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed h-36 border-destructive/40 bg-destructive/5 px-3 text-center">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="text-[11px] text-destructive leading-tight">{errorMsg}</span>
          <button type="button" onClick={triggerFileInput} className="text-xs font-medium text-primary underline">
            Use camera app
          </button>
        </div>
      ) : (
        /* Idle (initial) */
        <button
          type="button"
          onClick={startCamera}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed h-36 transition-default border-border bg-muted/30 hover:bg-muted/50 active:scale-[0.98]"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-center px-2">{label}</span>
          <span className="absolute bottom-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Camera className="w-3 h-3" /> Front camera
          </span>
        </button>
      )}

      {/* Hidden file input — WebView fallback (not display:none, works in Android WebView) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="absolute opacity-0 w-px h-px overflow-hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}