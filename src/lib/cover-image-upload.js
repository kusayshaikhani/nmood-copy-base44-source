// Shared cover-image picker + upload for Create Circle and Publish Experience.
//
// On iOS the Capacitor Camera plugin returns a `webPath` (a capacitor:// URL
// into the app's temp store), never a File. Handing that string to an upload
// call uploads nothing, which is why cover photos silently failed to attach.
// It has to be fetched and converted to a Blob/File first.
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { uploadImageToStorage } from '@/api/supabaseClient';
import { validateImageFile } from '@/lib/upload-security';

const MIME_BY_FORMAT = { jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export function isNativeCameraAvailable() {
  return Capacitor.isNativePlatform();
}

async function webPathToFile(webPath, format) {
  const response = await fetch(webPath);
  if (!response.ok) throw new Error('We could not read that photo from your device.');
  const blob = await response.blob();
  const ext = (format || 'jpeg').toLowerCase();
  const type = blob.type || MIME_BY_FORMAT[ext] || 'image/jpeg';
  return new File([blob], `cover-${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`, { type });
}

/**
 * Pick a cover image from the gallery or camera and return a real File.
 * @param {'camera'|'gallery'} source
 * @returns {Promise<File|null>} null when the user dismisses the picker
 */
export async function pickCoverImage(source) {
  try {
    const photo = await Camera.getPhoto({
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      resultType: CameraResultType.Uri,
      quality: 82,
      correctOrientation: true,
      allowEditing: false,
    });
    const path = photo?.webPath || photo?.path;
    if (!path) return null;
    return await webPathToFile(path, photo.format);
  } catch (err) {
    // The plugin rejects with a cancellation message when the sheet is dismissed.
    if (/cancel/i.test(String(err?.message || ''))) return null;
    throw err;
  }
}

/**
 * Validate and upload a cover image to the approved Supabase Storage bucket.
 * @returns {Promise<string>} public URL of the uploaded cover
 */
export async function uploadCoverImage(file, { onProgress } = {}) {
  const validation = validateImageFile(file, { maxMb: 5 });
  if (!validation.ok) throw new Error(validation.error);
  return uploadImageToStorage(file, { folder: 'covers', onProgress });
}
