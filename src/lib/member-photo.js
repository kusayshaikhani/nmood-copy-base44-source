/**
 * Single, app-wide priority chain for resolving a member's display photo.
 *
 * Delegates to the canonical gallery-normalizer so every surface (avatars,
 * thumbnails, lightbox, Home cards) shares one validation + normalization
 * path. Handles complete URLs, Base44 file URLs, object entries, and legacy
 * incomplete Unsplash identifiers uniformly.
 *
 *   1. photo_url            — primary profile photo
 *   2. image_url            — legacy / alternate field (kept for safety)
 *   3. photo_gallery[0]     — first gallery photo
 *   4. avatar               — already-mapped profile object field
 *   5. null                 — caller renders a polished fallback avatar
 */
import { resolveAvatar } from '@/lib/gallery-normalizer';

export function resolveMemberPhoto(member) {
  return resolveAvatar(member);
}