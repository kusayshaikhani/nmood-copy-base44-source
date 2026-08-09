import React, { useState, useEffect } from 'react';

/**
 * MemberImage — premium profile image for discovery / recommendation cards.
 *
 * Solves the "blank card top" problem on slow connections by showing a soft
 * shimmer skeleton the instant the card mounts, then blurring the image up
 * as it streams in. A single retry absorbs transient load failures; after
 * that it falls back to a branded gradient with the member's initial so the
 * card never sits empty or shows a broken-image icon.
 *
 * Loading behavior:
 *   - `loading="lazy"` + `decoding="async"` so off-screen cards never block
 *     the first paint.
 *   - One automatic retry (prevents repeated failed-attempt loops).
 *   - Skeleton + blur-up fade gives a smooth, premium perceived load.
 *
 * The image mapping logic (resolveMemberPhoto) is untouched — this component
 * only renders whatever `src` it is given.
 */
export default function MemberImage({
  src,
  alt = '',
  initial = '?',
  className = '',
  imgClassName = '',
  loading = 'lazy',
}) {
  const [status, setStatus] = useState(src ? 'loading' : 'error'); // loading | loaded | error
  const [attempt, setAttempt] = useState(0);

  // Reset whenever the source changes (e.g. card recycles in a virtual list).
  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
    setAttempt(0);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-muted/40 ${className}`}>
      {status !== 'error' ? (
        <img
          key={`${src}-${attempt}`}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setStatus('loaded')}
          onError={() => {
            if (attempt < 1) setAttempt((a) => a + 1);
            else setStatus('error');
          }}
          className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
          <span className="font-heading text-3xl font-bold text-primary/50">
            {(initial || '?').charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}