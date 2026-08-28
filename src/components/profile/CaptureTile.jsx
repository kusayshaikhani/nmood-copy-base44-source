import React, { useState, useRef } from 'react';
import { Camera as NativeCamera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { Camera, Loader2, Check, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * PV-001 — Native front-camera capture entry point for photo verification.
 * Capacitor Camera owns the full-screen live preview and permission prompt on
 * iOS/Android. The file input remains the browser fallback.
 */
export default function CaptureTile({ label, previewUrl, uploading, onCapture, onRetake }) {
  const [mode, setMode] = useState('idle'); // idle | opening | error
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    setErrorMsg('');
    setMode('opening');
    try {
      // Check (without prompting twice) whether camera access is permanently
      // denied first — calling requestPermissions() and then getPhoto() back
      // to back can race with UIImagePickerController's own session setup on
      // iOS and produce a black preview. Let getPhoto() own the single
      // permission prompt; only short-circuit when we already know it's denied.
      const current = await NativeCamera.checkPermissions().catch(() => null);
      if (current?.camera === 'denied') {
        throw new Error('camera_permission_denied');
      }
      const photo = await NativeCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        direction: CameraDirection.Front,
      });
      if (!photo.webPath) throw new Error('empty_capture');
      // Fetch the capacitor:// file URI into a Blob — the robust Capacitor
      // conversion path, instead of manually decoding a base64 string.
      const blob = await (await fetch(photo.webPath)).blob();
      if (!blob.size) throw new Error('empty_capture');
      const file = new File([blob], 'verification-selfie.jpg', { type: blob.type || 'image/jpeg' });
      // onCapture uploads the file and resolves { ok, error } — stay in the
      // "opening" (spinner) state until the upload settles, so a failed
      // attach/upload surfaces a clear retryable error instead of silently
      // reverting to the empty placeholder tile.
      const result = await onCapture(file);
      if (result?.ok === false) {
        setErrorMsg(result.error || 'Nmood could not attach that photo. Please try again.');
        setMode('error');
        return;
      }
      setMode('idle');
    } catch (err) {
      const name = err?.name || '';
      const message = String(err?.message || '').toLowerCase();
      if (name === 'UserCancelled' || message.includes('cancel')) {
        setMode('idle');
        return;
      }
      if (name === 'NotAllowedError' || name === 'SecurityError' || message.includes('permission')) {
        setErrorMsg('Nmood needs camera access for this selfie. Allow camera access in Settings and try again.');
      } else if (name === 'CameraNotAvailable' || name === 'NotFoundError' || message.includes('unavailable')) {
        setErrorMsg('Nmood could not find an available front camera on this device.');
      } else if (message.includes('empty_capture') || message.includes('fetch')) {
        setErrorMsg('Nmood could not read that photo. Please try again.');
      } else {
        setErrorMsg('Nmood could not start the camera. Please try again.');
      }
      setMode('error');
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMode('opening');
    const result = await onCapture(file);
    if (result?.ok === false) {
      setErrorMsg(result.error || 'Nmood could not attach that photo. Please try again.');
      setMode('error');
      return;
    }
    setMode('idle');
  };

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
      ) : mode === 'error' ? (
        /* Error state */
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed h-36 border-destructive/40 bg-destructive/5 px-3 text-center">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="text-[11px] text-destructive leading-tight">{errorMsg}</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={startCamera} className="text-xs font-medium text-primary underline">
              Try again
            </button>
            <button type="button" onClick={triggerFileInput} className="text-xs font-medium text-muted-foreground underline">
              Use camera app
            </button>
          </div>
        </div>
      ) : (
        /* Idle (initial) */
        <button
          type="button"
          onClick={startCamera}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed h-36 transition-default border-border bg-muted/30 hover:bg-muted/50 active:scale-[0.98]"
        >
          {uploading || mode === 'opening' ? (
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