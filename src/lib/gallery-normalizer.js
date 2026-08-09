/**
 * Canonical image + gallery normalizer.
 *
 * One shared module for every surface that renders a member photo or a
 * profile gallery: avatars, thumbnails, full-screen lightbox, prev/next
 * navigation, Home cards, Concierge cards.
 *
 * Handles every known storage shape:
 *   • complete https:// URLs
 *   • Base44 uploaded-file URLs (media.base44.com / files.*)
 *   • string gallery entries
 *   • gallery objects containing an approved URL field
 *       (url | src | photo_url | image_url | thumbnail | file_url)
 *   • legacy Unsplash identifiers beginning with `photo-` → prefixed to
 *       https://images.unsplash.com/{value} (only when confirmed Unsplash)
 *   • null / empty / malformed → null (caller renders a placeholder)
 *
 * Returns one consistent gallery item shape:
 *   { id, src, thumbnailSrc, alt }
 *
 * Both the thumbnail and the lightbox use the SAME normalized item, so a
 * thumbnail can never show a different image than the one the lightbox opens.
 */

const APPROVED_OBJECT_KEYS = [
  'url', 'src', 'photo_url', 'image_url', 'thumbnail', 'file_url', 'uri',
];

const UNSPLASH_ID_RE = /^photo-[a-z0-9]+(-[a-z0-9]+)*(\?[^]*)?$/i;

/**
 * Normalize a single raw image value into a usable URL string, or null.
 *
 * Accepts: string URL, object with an approved key, or null.
 * Does NOT guess — only prefixes `photo-` values that are confirmed
 * Unsplash identifiers. Unknown values return null.
 */
export function normalizeImageUrl(value) {
  if (value == null) return null;

  // Already a string.
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Complete URL — use as-is.
    if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed) || /^blob:/i.test(trimmed)) {
      return trimmed;
    }

    // Confirmed Unsplash identifier (photo-XXXX…). Prefix with the CDN origin.
    if (UNSPLASH_ID_RE.test(trimmed)) {
      return `https://images.unsplash.com/${trimmed}`;
    }

    // Anything else (relative paths, bare filenames, malformed) — do not
    // blindly prefix. Return null so the caller shows a placeholder.
    return null;
  }

  // Object — try each approved key, recurse into the value.
  if (typeof value === 'object' && !Array.isArray(value)) {
    for (const key of APPROVED_OBJECT_KEYS) {
      if (value[key] != null) {
        const resolved = normalizeImageUrl(value[key]);
        if (resolved) return resolved;
      }
    }
    return null;
  }

  return null;
}

/**
 * Build a consistent gallery item from a raw gallery entry.
 *
 * Returns { id, src, thumbnailSrc, alt } or null when the entry is
 * irrecoverably invalid. Both the thumbnail and the lightbox read from
 * this same object.
 *
 * @param {*} entry      Raw gallery entry (string, object, or null).
 * @param {number} index Positional index for id + alt fallback.
 * @param {string} name  Display name for alt text (optional).
 */
export function normalizeGalleryItem(entry, index = 0, name = '') {
  const src = normalizeImageUrl(entry);
  if (!src) return null;

  const safeName = (name || '').trim();
  const alt = safeName
    ? `${safeName} — photo ${index + 1}`
    : `Profile photo ${index + 1}`;

  return {
    id: `${index}-${src.slice(-40)}`,
    src,
    thumbnailSrc: src,
    alt,
  };
}

/**
 * Normalize an entire gallery array into a list of valid items.
 * Invalid entries are silently dropped; the caller hides the section
 * when the result is empty.
 *
 * @param {Array} gallery  Raw photo_gallery / gallery_photos array.
 * @param {string} name    Display name for alt text.
 * @returns {Array<{id,src,thumbnailSrc,alt}>}
 */
export function normalizeGallery(gallery, name = '') {
  if (!Array.isArray(gallery)) return [];
  return gallery
    .map((entry, i) => normalizeGalleryItem(entry, i, name))
    .filter(Boolean);
}

/**
 * Resolve a member's avatar URL using the same canonical normalizer.
 * Priority: photo_url → image_url → photo_gallery[0] → avatar.
 */
export function resolveAvatar(member) {
  if (!member) return null;
  const candidates = [
    member.photo_url,
    member.image_url,
    Array.isArray(member.photo_gallery) ? member.photo_gallery[0] : null,
    member.avatar,
    member.profile_photo,
  ];
  for (const c of candidates) {
    const url = normalizeImageUrl(c);
    if (url) return url;
  }
  return null;
}