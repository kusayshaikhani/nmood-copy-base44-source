import React, { forwardRef, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { pickProfilePhoto, pickProfilePhotos } from '@/lib/profile-photo-camera';

// Preserve upload handlers, but never open an HTML file chooser on native iOS.
/** @type {React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>} */
const NativePhotoInput = forwardRef(function NativePhotoInput({ onChange, onClick, capture, multiple, maxSelection = 6, onPickerError, onPickerCancel, ...props }, ref) {
  const busy = useRef(false);
  return <input {...props} multiple={multiple} ref={ref} capture={capture} onChange={onChange} onClick={async (event) => {
    if (!Capacitor.isNativePlatform()) { onClick?.(event); return; }
    event.preventDefault();
    if (busy.current || props.disabled) return;
    busy.current = true;
    try {
      const files = multiple && !capture ? await pickProfilePhotos(maxSelection) : [await pickProfilePhoto(capture ? 'camera' : 'gallery')].filter(Boolean);
      if (files.length) {
        const target = { files, value: '' };
        const change = /** @type {unknown} */ ({ target, currentTarget: target, preventDefault() {}, stopPropagation() {} });
        await onChange?.(/** @type {React.ChangeEvent<HTMLInputElement>} */ (change));
      } else onPickerCancel?.();
    } catch {
      const message = 'Could not open the photo. Check camera or photo access in Settings and try again.';
      if (onPickerError) onPickerError(message); else toast.error(message);
    } finally { busy.current = false; }
  }} />;
});
export default NativePhotoInput;
