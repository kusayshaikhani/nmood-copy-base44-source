// SEC-001 — Client-side upload validation (defense in depth).
// The server remains the authoritative validator; this prevents
// obviously unsafe or oversized files from being uploaded.
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const DEFAULT_MAX_MB = 8;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif)$/i;
const SUSPICIOUS = /\.(exe|bat|cmd|sh|js|html|svg|xml|php|jsp|asp|dll)$/i;

export function validateImageFile(file, opts = {}) {
  const maxMb = opts.maxMb || DEFAULT_MAX_MB;
  if (!file) return { ok: false, error: 'No file selected.' };
  if (file.size > maxMb * 1024 * 1024) return { ok: false, error: `Image must be under ${maxMb}MB.` };
  const name = file.name || '';
  if (SUSPICIOUS.test(name)) return { ok: false, error: 'This file type is not allowed.' };
  const type = (file.type || '').toLowerCase();
  if (type && !IMAGE_TYPES.includes(type)) return { ok: false, error: 'Only JPG, PNG, WEBP, or GIF images are allowed.' };
  // Some mobile cameras report an empty MIME type — fall back to extension.
  if (!type && !IMAGE_EXT.test(name)) return { ok: false, error: 'Only JPG, PNG, WEBP, or GIF images are allowed.' };
  return { ok: true };
}