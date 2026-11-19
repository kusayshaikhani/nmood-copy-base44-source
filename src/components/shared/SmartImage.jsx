import React, { useState, useEffect, useRef } from 'react';
import {imagePresentation, applyImagePresentation, imageCrop} from '@/lib/profile-image-presentation';
import { Sparkles, ImageOff } from 'lucide-react';
import { normalizeImageUrl } from '@/lib/gallery-normalizer';

/**
 * DP-002 — Standardized image behavior: blur-up loading, lazy loading,
 * graceful fallback, and one-tap retry on failure. Never shows a broken
 * image icon. Pass `fallback` for a custom placeholder (e.g. avatar initials).
 *
 * All src values pass through the canonical normalizer, so incomplete
 * Unsplash IDs, object entries, and malformed values are handled uniformly.
 */
export default function SmartImage({ src, alt = '', className = '', rounded = 'rounded-xl', fallback, blur = true, objectFit = 'object-cover', portraitPosition }) {
  const normalizedSrc = normalizeImageUrl(src);
  const [status, setStatus] = useState(normalizedSrc ? 'loading' : 'error'); // loading | loaded | error
  const [attempt, setAttempt] = useState(0);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!normalizedSrc) { setStatus('error'); return; }
    setStatus('loading');
  }, [normalizedSrc, attempt]);

  const retry = () => setAttempt((a) => a + 1);

  return (
    <div className={`relative overflow-hidden bg-muted ${rounded} ${className}`}>
      {blur && status === 'loading' && <div className="absolute inset-0 shimmer" aria-hidden="true" />}

      {status !== 'error' ? (
        <img
          ref={imgRef}
          key={`${normalizedSrc}-${attempt}`}
          src={normalizedSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          style={objectFit==='object-cover'?imagePresentation(normalizedSrc):{imageOrientation:'from-image'}}
          onLoad={(event) => { if(objectFit==='object-cover'){applyImagePresentation(event,normalizedSrc);if(portraitPosition&&!imageCrop(normalizedSrc))event.currentTarget.style.objectPosition=event.currentTarget.naturalHeight>event.currentTarget.naturalWidth?portraitPosition:'center';} setStatus('loaded'); }}
          onError={() => { if (attempt < 1) setAttempt((a) => a + 1); else setStatus('error'); }}
          className={`w-full h-full ${objectFit} transition-all duration-500 ${status === 'loaded' ? 'blur-0 scale-100 opacity-100' : 'blur-xl scale-105 opacity-0'}`}
        />
      ) : normalizedSrc ? (<div className="flex h-full items-center justify-center bg-muted" role="img" aria-label="Photo unavailable"><ImageOff aria-hidden="true"/></div>) : fallback ? (
        fallback
      ) : (
        <div className="w-full h-full min-h-[80px] flex items-center justify-center bg-gradient-to-br from-primary/8 via-accent/8 to-primary/4" aria-label={alt || 'Image unavailable'}>
          <div className="w-9 h-9 rounded-lg bg-nmood-gradient flex items-center justify-center shadow-soft opacity-80">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
        </div>
      )}
    </div>
  );
}