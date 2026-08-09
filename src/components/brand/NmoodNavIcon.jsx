import React from 'react';
import { NAV_N_MARK } from '@/lib/brand-assets';

/**
 * NmoodNavIcon — the official v2 "N" mark for the Nmood bottom-nav tab.
 *
 * Rendered as a CSS luminance mask over currentColor so the active/inactive
 * theme colors flow from the parent automatically — matching the lucide icons
 * beside it (text-primary when active, nav-inactive when not).
 *
 * The source PNG is white-on-dark-blue; mask-mode:luminance extracts just the
 * white N shape (high luminance = visible, dark blue = hidden), and
 * background-color:currentColor fills it with the parent's text color.
 */
export default function NmoodNavIcon({ size = 20, active = false }) {
  return (
    <span
      role="img"
      aria-label="Nmood"
      className={`inline-block transition-colors duration-200 ${active ? 'text-primary' : 'nav-inactive'}`}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        backgroundColor: 'currentColor',
        WebkitMask: `url(${NAV_N_MARK}) no-repeat center / contain`,
        mask: `url(${NAV_N_MARK}) no-repeat center / contain`,
        WebkitMaskMode: 'luminance',
        maskMode: 'luminance',
      }}
    />
  );
}