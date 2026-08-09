import React from 'react';
import { Camera, Image as ImageIcon, Trash2, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { haptic } from '@/lib/haptics';

/**
 * M-001 — "Change Photo" bottom sheet.
 * Never opens the camera/gallery directly; surfaces Take Photo / Gallery /
 * Remove (only when an image exists) / Cancel. Dismissed by Cancel, swipe
 * down, or outside tap (handled by the Sheet).
 */
function Row({ icon, label, onClick, tone = 'default' }) {
  const tones = {
    default: 'hover:bg-muted text-foreground',
    danger: 'hover:bg-destructive/5 text-destructive',
    muted: 'hover:bg-muted text-muted-foreground',
  };
  const badge = {
    default: 'bg-primary/10 text-primary',
    danger: 'bg-destructive/10 text-destructive',
    muted: 'bg-muted text-muted-foreground',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl transition-default text-left ${tones[tone]}`}
    >
      <span className={`w-9 h-9 rounded-full flex items-center justify-center ${badge[tone]}`}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function MediaPickerSheet({ open, onOpenChange, hasImage, onCamera, onGallery, onRemove }) {
  const close = (fn) => { haptic('selection'); onOpenChange(false); if (fn) fn(); };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-3" />
        <SheetHeader className="px-5 mb-2">
          <SheetTitle>Change Photo</SheetTitle>
        </SheetHeader>
        <div className="px-3 pb-4 space-y-1">
          <Row icon={<Camera className="w-5 h-5" />} label="Take Photo" onClick={() => close(onCamera)} />
          <Row icon={<ImageIcon className="w-5 h-5" />} label="Choose From Gallery" onClick={() => close(onGallery)} />
          {hasImage && <Row icon={<Trash2 className="w-5 h-5" />} label="Remove Photo" tone="danger" onClick={() => close(onRemove)} />}
          <Row icon={<X className="w-5 h-5" />} label="Cancel" tone="muted" onClick={() => close()} />
        </div>
      </SheetContent>
    </Sheet>
  );
}