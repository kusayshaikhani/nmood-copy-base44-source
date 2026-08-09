import React from 'react';
import { BRAND } from '@/lib/system-config';

// Subtle brand signature used on Membership & Upgrade screens.
export default function MembershipSlogan({ className = '' }) {
  return (
    <p className={`text-center text-[11px] tracking-[0.25em] uppercase text-muted-foreground/70 ${className}`}>
      {BRAND.slogan_inline}
    </p>
  );
}