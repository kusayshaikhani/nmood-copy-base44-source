import { Capacitor } from '@capacitor/core';
import {
  Camera,
  CameraDirection,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';

const MIME_BY_FORMAT = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function isCancellation(error) {
  return error?.name === 'UserCancelled' ||
    /cancel/i.test(String(error?.message || ''));
}

function isCameraUnavailable(error) {
  const name = error?.name || '';
  const message = String(error?.message || '').toLowerCase();
  return name === 'CameraNotAvailable' ||
    name === 'NotFoundError' ||
    message.includes('camera unavailable') ||
    message.includes('no camera');
}

export async function pickProfilePhoto(source = 'camera') {
  if (!Capacitor.isNativePlatform()) return { fallback: true };

  try {
    const photo = await Camera.getPhoto({
      source: source === 'gallery' ? CameraSource.Photos : CameraSource.Camera,
      direction: CameraDirection.Front,
      resultType: CameraResultType.Uri,
      quality: 90,
      correctOrientation: true,
      allowEditing: false,
      saveToGallery: false,
    });
    const path = photo?.webPath || photo?.path;
    if (!path) return null;
    const response = await fetch(path);
    if (!response.ok) throw new Error('Nmood could not read that photo.');
    const blob = await response.blob();
    const format = (photo.format || 'jpeg').toLowerCase();
    const extension = format === 'jpeg' ? 'jpg' : format;
    return new File(
      [blob],
      'profile-photo.' + extension,
      { type: blob.type || MIME_BY_FORMAT[format] || 'image/jpeg' },
    );
  } catch (error) {
    if (isCancellation(error)) return null;
    if (isCameraUnavailable(error)) throw new Error('Camera unavailable. Select from Gallery instead.');
    throw error;
  }
}

export const captureProfilePhoto = () => pickProfilePhoto('camera');

// Native gallery multi-selection. A zero capacity must never mean unlimited.
export async function pickProfilePhotos(limit = 6) {
  if (!Capacitor.isNativePlatform()) return [];
  if (!Number.isInteger(limit) || limit <= 0) return [];
  try {
    const result = await Camera.pickImages({ quality: 90, correctOrientation: true, limit });
    const photos = result?.photos || [];
    if (photos.length > limit) throw new Error('Too many photos selected.');
    return await Promise.all(photos.map(async (photo, index) => {
      if (!photo.webPath) throw new Error('Photo unavailable.');
      const response = await fetch(photo.webPath);
      if (!response.ok) throw new Error('Photo unavailable.');
      const blob = await response.blob();
      const format = (photo.format || 'jpeg').toLowerCase();
      return new File([blob], `gallery-${index}.${format === 'jpeg' ? 'jpg' : format}`, { type: blob.type || MIME_BY_FORMAT[format] || 'image/jpeg' });
    }));
  } catch (error) {
    if (isCancellation(error)) return [];
    throw error;
  }
}
