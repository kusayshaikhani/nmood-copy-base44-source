import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, RotateCcw, Check, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';

const ASPECTS = [
  { key: 'square', label: 'Square', ratio: 1 },
  { key: 'free', label: 'Free', ratio: null },
  { key: 'portrait', label: 'Portrait', ratio: 3 / 4 },
  { key: 'landscape', label: 'Landscape', ratio: 4 / 3 },
];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * M-001 — Image crop editor.
 * Move (drag) · Zoom (slider, wheel, pinch) · Rotate (±90°) · Aspect ratio
 * (Square default, Free, Portrait, Landscape). Returns a JPEG blob of the
 * cropped region at up to 2048px on its longest side.
 */
export default function ImageCropper({ open, imageSrc, defaultAspect = 'square', onConfirm, onCancel }) {
  const [aspectKey, setAspectKey] = useState(defaultAspect || 'square');
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [img, setImg] = useState(null);
  const [busy, setBusy] = useState(false);
  const frameRef = useRef(null);
  const dragRef = useRef({ active: false, sx: 0, sy: 0, bx: 0, by: 0 });
  const pointers = useRef(new Map());
  const pinchStart = useRef(null);

  const aspect = ASPECTS.find((a) => a.key === aspectKey) || ASPECTS[0];

  useEffect(() => {
    if (!open || !imageSrc) return;
    setZoom(1); setTx(0); setTy(0); setRotation(0); setAspectKey(defaultAspect || 'square');
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => setImg(image);
    image.src = imageSrc;
  }, [open, imageSrc, defaultAspect]);

  // base scale so the image covers the frame at zoom = 1.
  const baseScale = (() => {
    if (!img || !frameRef.current) return 1;
    const f = frameRef.current;
    return Math.max(f.clientWidth / img.naturalWidth, f.clientHeight / img.naturalHeight);
  })();

  const clampPan = useCallback((nx, ny, z) => {
    if (!img || !frameRef.current) return { x: nx, y: ny };
    const f = frameRef.current;
    const dw = img.naturalWidth * baseScale * z;
    const dh = img.naturalHeight * baseScale * z;
    const maxX = Math.max(0, (dw - f.clientWidth) / 2);
    const maxY = Math.max(0, (dh - f.clientHeight) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, nx)), y: Math.min(maxY, Math.max(-maxY, ny)) };
  }, [img, baseScale]);

  // keep the frame filled when zoom changes
  useEffect(() => {
    const c = clampPan(tx, ty, zoom);
    if (c.x !== tx || c.y !== ty) { setTx(c.x); setTy(c.y); }
  }, [zoom, clampPan]);

  const setAspect = (key) => { haptic('selection'); setAspectKey(key); setTx(0); setTy(0); };
  const setZoomClamped = (z) => setZoom(Math.min(4, Math.max(1, Math.round(z * 100) / 100)));

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinchStart.current = { dist: dist(pts[0], pts[1]), zoom };
      dragRef.current.active = false;
    } else {
      dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, bx: tx, by: ty };
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const d = dist(pts[0], pts[1]);
      setZoomClamped(pinchStart.current.zoom * (d / pinchStart.current.dist || 1));
      return;
    }
    if (!dragRef.current.active) return;
    const c = clampPan(dragRef.current.bx + (e.clientX - dragRef.current.sx), dragRef.current.by + (e.clientY - dragRef.current.sy), zoom);
    setTx(c.x); setTy(c.y);
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragRef.current.active = false;
  };

  const onWheel = (e) => {
    try { e.preventDefault(); } catch {}
    setZoomClamped(zoom - e.deltaY * 0.0025);
  };

  const renderCanvas = () => {
    if (!img || !frameRef.current) return null;
    const f = frameRef.current;
    const ratio = aspect.ratio || f.clientWidth / f.clientHeight;
    const outLong = Math.min(2048, Math.round(Math.max(f.clientWidth, f.clientHeight) * 2));
    const outW = ratio >= 1 ? outLong : Math.round(outLong * ratio);
    const outH = ratio >= 1 ? Math.round(outLong / ratio) : outLong;
    const canvas = document.createElement('canvas');
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    const k = outW / f.clientWidth;
    ctx.translate(outW / 2, outH / 2);
    ctx.translate(tx * k, ty * k);
    const s = baseScale * zoom * k;
    ctx.scale(s, s);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    return canvas;
  };

  const handleConfirm = async () => {
    const canvas = renderCanvas();
    if (!canvas) return;
    setBusy(true);
    try {
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
      haptic('success');
      onConfirm?.(blob);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-3 h-14 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel cropping"><X className="w-5 h-5" /></Button>
        <h2 className="font-semibold">Crop</h2>
        <Button variant="ghost" size="icon" onClick={handleConfirm} disabled={busy || !img} aria-label="Confirm crop"><Check className="w-5 h-5 text-primary" /></Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <div
          ref={frameRef}
          className="relative overflow-hidden bg-muted touch-none max-w-full max-h-full rounded-lg"
          style={{
            width: 'min(92vw, 420px)',
            aspectRatio: aspect.ratio ? String(aspect.ratio) : undefined,
            height: aspect.ratio ? undefined : 'min(60vh, 520px)',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {img && (
            <img
              src={imageSrc}
              alt="Crop"
              className="absolute select-none max-w-none"
              draggable={false}
              style={{
                width: img.naturalWidth,
                height: img.naturalHeight,
                left: '50%',
                top: '50%',
                marginLeft: -img.naturalWidth / 2,
                marginTop: -img.naturalHeight / 2,
                transform: `translate(${tx}px, ${ty}px) scale(${baseScale * zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
              }}
            />
          )}
          <div className="absolute inset-0 pointer-events-none border border-white/40 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.35)]" />
          <div className="absolute inset-0 pointer-events-none opacity-60">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pb-[env(safe-area-inset-bottom)] pt-2 space-y-3">
        <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar">
          {ASPECTS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAspect(a.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-default whitespace-nowrap ${aspectKey === a.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setZoomClamped(zoom - 0.1)} aria-label="Zoom out"><ZoomOut className="w-4 h-4" /></Button>
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoomClamped(parseFloat(e.target.value))}
            className="w-40 accent-primary"
            aria-label="Zoom level"
          />
          <Button variant="outline" size="icon" onClick={() => setZoomClamped(zoom + 0.1)} aria-label="Zoom in"><ZoomIn className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setRotation((r) => (r + 270) % 360)} aria-label="Rotate left"><RotateCcw className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setRotation((r) => (r + 90) % 360)} aria-label="Rotate right"><RotateCw className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}