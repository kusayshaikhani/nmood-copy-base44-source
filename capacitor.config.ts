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
    // RevenueCat In-App Purchases — official SDK for Apple/Google subscriptions.
    // Configured with the public iOS SDK key; no secrets in client.
    Purchases: {
      // No configuration needed here; SDK is configured in JS after Supabase auth.
    },
  },
};

export default config;
