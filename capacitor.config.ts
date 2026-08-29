import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nmood.app',
  appName: 'Nmood',
  webDir: 'dist',
  plugins: {
    // Native Sign in with Apple / Google identity-token flow — no browser,
    // no PKCE, no nmood:// callback. Facebook/Twitter are disabled so their
    // SDKs are never bundled.
    SocialLogin: {
      providers: {
        google: true,
        apple: true,
        facebook: false,
        twitter: false,
      },
    },
  },
};

export default config;
