import React from 'react';
import { Heart } from 'lucide-react';
import { NAV_N_MARK } from '@/lib/brand-assets';

// The heart carries Nmood's approved N-mark as a tiny coral signature.
export default function LikesNavIcon({ active = false, size = 20 }) {
  return <span className="relative inline-flex" style={{ width: size, height: size }}>
    <Heart className={active ? 'text-primary' : 'nav-inactive'} width={size} height={size} strokeWidth={active ? 2.5 : 2} />
    <img src={NAV_N_MARK} alt="" aria-hidden="true" className="absolute -right-1 -top-1 h-2.5 w-2.5 object-contain [filter:brightness(0)_saturate(100%)_invert(55%)_sepia(66%)_saturate(2762%)_hue-rotate(319deg)_brightness(100%)_contrast(101%)]" />
  </span>;
}
