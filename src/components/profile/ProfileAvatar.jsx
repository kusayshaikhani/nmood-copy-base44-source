import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { normalizeImageUrl } from '@/lib/gallery-normalizer';

// BUG-002: profile avatar with a loading placeholder (shimmer), one automatic
// retry on a transient load failure, and an initials fallback — never shows a
// broken image. Reused across profile surfaces so every component renders the
// latest member.photo value consistently. Src is normalized through the
// canonical gallery-normalizer so incomplete Unsplash IDs / object entries
// are handled uniformly.
export default function ProfileAvatar({ src, alt = '', initials = 'U', className = '', fallbackClassName = '' }) {
  const normalizedSrc = normalizeImageUrl(src);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState(normalizedSrc ? 'loading' : 'fallback'); // loading | loaded | fallback

  useEffect(() => {
    setAttempt(0);
    setStatus(normalizedSrc ? 'loading' : 'fallback');
  }, [normalizedSrc]);

  const handleLoadingStatus = (s) => {
    if (s === 'loaded') {
      setStatus('loaded');
    } else if (s === 'error') {
      // Retry once before falling back to initials.
      if (attempt < 1) {
        setAttempt((a) => a + 1);
        setStatus('loading');
      } else {
        setStatus('fallback');
      }
    }
  };

  return (
    <Avatar className={`${className} relative`}>
      {normalizedSrc && status !== 'fallback' && (
        <AvatarImage
          key={`${normalizedSrc}-${attempt}`}
          src={normalizedSrc}
          alt={alt}
          className="object-cover z-0"
          onLoadingStatusChange={handleLoadingStatus}
        />
      )}
      <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
    </Avatar>
  );
}