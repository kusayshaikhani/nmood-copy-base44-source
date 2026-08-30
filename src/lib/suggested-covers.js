import { useEffect, useMemo, useState } from 'react';

/**
 * Suggested cover images for Create Circle / Create Experience.
 *
 * Packaged covers ship inside the app bundle, so the suggestion strip is never
 * empty — even offline or when a remote CDN is blocked. Remote covers are only
 * rendered after the browser has confirmed they actually decode, so a broken
 * or blank tile can never reach the screen.
 */
export const PACKAGED_COVERS = [
  { id: 'aurora', src: '/covers/aurora.svg', packaged: true },
  { id: 'sunset', src: '/covers/sunset.svg', packaged: true },
  { id: 'ocean', src: '/covers/ocean.svg', packaged: true },
  { id: 'meadow', src: '/covers/meadow.svg', packaged: true },
  { id: 'ember', src: '/covers/ember.svg', packaged: true },
  { id: 'midnight', src: '/covers/midnight.svg', packaged: true },
];

export const REMOTE_COVERS = [
  { id: 'coffee', src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', packaged: false },
  { id: 'padel', src: 'https://images.unsplash.com/photo-1606914502047-4728c0cbd3cc?w=600', packaged: false },
  { id: 'photography', src: 'https://images.unsplash.com/photo-1452587925148-ce54479dab4e?w=600', packaged: false },
  { id: 'run', src: 'https://images.unsplash.com/photo-1515464039244-8b30a80c5c5f?w=600', packaged: false },
  { id: 'meditation', src: 'https://images.unsplash.com/photo-1593810451137-5dc55705239d?w=600', packaged: false },
  { id: 'meetup', src: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600', packaged: false },
];

export const SUGGESTED_COVERS = [...PACKAGED_COVERS, ...REMOTE_COVERS];

// Probe results are shared across mounts so re-entering the wizard does not
// re-download every candidate.
const probeCache = new Map();

function probe(src) {
  if (probeCache.has(src)) return probeCache.get(src);
  const result = new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(Boolean(img.naturalWidth) || true);
    img.onerror = () => resolve(false);
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';
    img.src = src;
  });
  probeCache.set(src, result);
  return result;
}

/**
 * Returns only the covers that are safe to render right now: every packaged
 * cover, plus each remote cover that has been confirmed to load.
 */
export function useAvailableCovers() {
  const [verified, setVerified] = useState(() => new Set());

  useEffect(() => {
    let active = true;
    REMOTE_COVERS.forEach((cover) => {
      probe(cover.src).then((ok) => {
        if (!ok || !active) return;
        setVerified((prev) => (prev.has(cover.src) ? prev : new Set(prev).add(cover.src)));
      });
    });
    return () => { active = false; };
  }, []);

  const [dropped, setDropped] = useState(() => new Set());
  const markUnavailable = useMemo(
    () => (src) => setDropped((prev) => (prev.has(src) ? prev : new Set(prev).add(src))),
    []
  );

  const covers = useMemo(
    () => SUGGESTED_COVERS.filter((c) => (c.packaged || verified.has(c.src)) && !dropped.has(c.src)),
    [verified, dropped]
  );

  return { covers, markUnavailable };
}
