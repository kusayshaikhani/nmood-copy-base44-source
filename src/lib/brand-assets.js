// Nmood brand assets v9.0 — official final assets attached 2026-08-02.
//   • App Icon  → all OS / external surfaces (favicon, app launcher, app
//                 drawer, notifications, Apple App Store, Google Play, PWA,
//                 recent apps, social preview). Never the wordmark.
//   • Brand Logo → in-app only (splash, login, register, welcome, about,
//                 navigation, mission control, loading).
//   • Nav N-Mark → bottom-nav tab symbol, rendered as CSS mask / currentColor.
// Master assets uploaded 2026-08-02 (v9 — final v2 batch). Do NOT recreate, redraw, or vectorize.
const BASE = 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c';
const V = '20260802v10';

// ── App Icon — 1024×1024 master, opaque background ──────────────────────────
// Square, centered, flat, recognizable down to 16×16.
// The icon carries its own dark background so it reads on both light and dark
// OS themes. Favicons at all standard sizes are derived from this 1024 master.
export const APP_ICON_URL = `${BASE}/fd1b4af34_Nmood-App-Icon-1024.png?v=${V}`;

export const APP_ICON = {
  light: {
    master: APP_ICON_URL,
    x1024:  APP_ICON_URL,
    x256:   APP_ICON_URL,
  },
  dark: {
    master: APP_ICON_URL,
    x1024:  APP_ICON_URL,
    x256:   APP_ICON_URL,
  },
};

// ── Brand Logo — official "Nmood" wordmark v2 (in-app only) ────────────────
// Release 1.0 brand standard — the ONLY approved logos:
//   • light theme (light bg) → Wordmark-Dark-v2  (navy logotype on bright backgrounds)
//   • dark theme  (dark bg)  → Wordmark-Light-v2 (white logotype on dark backgrounds)
// Selection is automatic via theme (getBrandAssets / getBrandLogoUrl).
export const BRAND_LOGO = {
  light: { full: `${BASE}/f308822b0_Nmood-Wordmark-Dark-v2.png?v=${V}` },  // navy wordmark for light backgrounds
  dark:  { full: `${BASE}/9116f3a71_Nmood-Wordmark-Light-v2.png?v=${V}` }, // white wordmark for dark backgrounds
};

// ── Nav "N" mark — approved bright symbol for the Nmood bottom-nav tab ───────
// The transparent local PNG is used directly so its approved bright artwork
// is preserved in web and native WebViews.
export const NAV_N_MARK = '/nmood-n-mark-1024.png';

// Backward-compatible map (single canonical source image).
export const NAV_N_ICONS = {
  light: NAV_N_MARK,
  dark:  NAV_N_MARK,
};
export const NAV_N_ICON = NAV_N_MARK;
export const getNavNIcon = (theme) => NAV_N_MARK;

// ── Favicon sizes — all derived from the 1024×1024 app icon master ──────────
export const FAVICON_SIZES = {
  x16:  APP_ICON_URL,
  x32:  APP_ICON_URL,
  x48:  APP_ICON_URL,
  x64:  APP_ICON_URL,
  x128: APP_ICON_URL,
  x180: APP_ICON_URL,
  x192: APP_ICON_URL,
  x256: APP_ICON_URL,
  x512: APP_ICON_URL,
};

// ── External surface URLs (App Icon, NOT the wordmark) ────────────────────
export const FAVICON_URL          = APP_ICON_URL;  // browser tab / pinned
export const APPLE_TOUCH_ICON_URL = APP_ICON_URL;  // iOS home screen
export const ANDROID_ICON_512_URL = APP_ICON_URL;  // Google Play 512
export const OG_IMAGE_URL         = APP_ICON_URL;  // social preview

// ── Theme-aware accessors ─────────────────────────────────────────────────
export const getAppIcon = (theme, variant = 'master') =>
  APP_ICON[theme === 'dark' ? 'dark' : 'light'][variant];

export const getBrandLogoUrl = (theme) =>
  BRAND_LOGO[theme === 'dark' ? 'dark' : 'light'].full;

// Backward-compatible shape consumed by BrandLogo / BrandIcon components.
export const BRAND_ASSETS = {
  light: {
    fullLogo:  BRAND_LOGO.light.full,
    icon:      APP_ICON.light.master,
    iconSmall: APP_ICON.light.x256,
    largeLogo: APP_ICON.light.x1024,
  },
  dark: {
    fullLogo:  BRAND_LOGO.dark.full,
    icon:      APP_ICON.dark.master,
    iconSmall: APP_ICON.dark.x256,
    largeLogo: APP_ICON.dark.x1024,
  },
};

export const getBrandAssets = (theme) => BRAND_ASSETS[theme === 'dark' ? 'dark' : 'light'];