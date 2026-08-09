// M-001 — Universal image processing.
// EXIF orientation correction, intelligent compression, longest-side resize,
// and thumbnail generation. Pure + framework-agnostic; the MediaPicker runs
// every uploaded image through here before sending it to storage.

const MAX_LONG_SIDE = 2048;
const MAX_BYTES = 5 * 1024 * 1024;
const THUMB_LONG_SIDE = 512;

// Decodes an image with EXIF orientation applied.
// createImageBitmap({ imageOrientation }) is the most reliable cross-browser
// path; we fall back to an <img> (modern browsers honor orientation via
// image-orientation) when the Bitmap API is missing or rejects (e.g. HEIC on
// some engines).
function loadImageOriented(file) {
  return new Promise((resolve, reject) => {
    const fallback = () => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    };
    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file, { imageOrientation: 'from-image' })
        .then((bm) => resolve(bm))
        .catch(fallback);
    } else {
      fallback();
    }
  });
}

function drawToCanvas(src) {
  const w = src.width || src.naturalWidth;
  const h = src.height || src.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // White background so transparent PNGs don't turn black under JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);
  return canvas;
}

function resizeCanvas(srcCanvas, longSide) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const scale = Math.min(1, longSide / Math.max(w, h));
  if (scale >= 1) return srcCanvas;
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(w * scale));
  out.height = Math.max(1, Math.round(h * scale));
  const ctx = out.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, 0, 0, out.width, out.height);
  return out;
}

function toBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

// Compress by stepping quality down, then progressively downscaling, until the
// blob is under maxBytes (or we hit a floor).
async function compressCanvas(canvas, maxBytes) {
  let quality = 0.85;
  let blob = await toBlob(canvas, quality);
  while (blob && blob.size > maxBytes && quality > 0.4) {
    quality = Math.max(0.4, Math.round((quality - 0.1) * 100) / 100);
    blob = await toBlob(canvas, quality);
  }
  let c = canvas;
  while ((!blob || blob.size > maxBytes) && Math.max(c.width, c.height) > 512) {
    c = resizeCanvas(c, Math.round(Math.max(c.width, c.height) * 0.85));
    blob = await toBlob(c, quality);
  }
  return blob;
}

// file → { blob, thumbnailBlob, width, height }
export async function processImage(file, opts = {}) {
  const maxLongSide = opts.maxLongSide || MAX_LONG_SIDE;
  const maxBytes = (opts.maxMb || 5) * 1024 * 1024;
  const withThumb = opts.thumbnail !== false;

  const src = await loadImageOriented(file);
  const full = drawToCanvas(src);
  if (src.close) src.close();

  const resized = resizeCanvas(full, maxLongSide);
  const blob = await compressCanvas(resized, maxBytes);

  let thumbnailBlob = null;
  if (withThumb) {
    const thumb = resizeCanvas(resized, THUMB_LONG_SIDE);
    thumbnailBlob = await toBlob(thumb, 0.7);
  }
  return { blob, thumbnailBlob, width: resized.width, height: resized.height };
}

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';