import { mapsBuildKey } from './scripts/maps/build-policy.mjs'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { validateSupabaseConfig } from './config/supabase-boundary.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isRehearsal = mode === 'rehearsal';
  const isMainDevice = process.env.NMOOD_ASSET_FLAVOR === 'main';
  if (isMainDevice && mode !== 'production') throw new Error('Main device assets require explicit production compilation mode.');
  const envDir = isRehearsal
    ? fileURLToPath(new URL('./config/rehearsal-env', import.meta.url))
    : process.cwd();
  const fileEnv = loadEnv(mode, envDir, 'VITE_');
  // Use the local, ignored VITE_ values for an explicitly protected Maps build.
  // Shell values still take precedence for CI and device-specific builds.
  const mapsKey = mapsBuildKey({mode,flavor:process.env.NMOOD_ASSET_FLAVOR,environment:{...fileEnv,...process.env}});
  // Rehearsal builds are intentionally isolated from the root .env.local and
  // from inherited VITE_* shell values. Only the ignored rehearsal-local file
  // is exposed to client code through explicit compile-time definitions.
  const env = isRehearsal ? fileEnv : { ...fileEnv, ...process.env };

  if (mode !== 'test') {
    validateSupabaseConfig({
      mode,
      target: env.VITE_SUPABASE_TARGET,
      url: env.VITE_SUPABASE_URL,
      publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
      projectRef: env.VITE_SUPABASE_PROJECT_REF,
      productionProjectRef: env.VITE_PRODUCTION_SUPABASE_PROJECT_REF,
      allowProduction: env.VITE_ALLOW_PRODUCTION_SUPABASE,
    });
  }

  // Rehearsal keeps VITE_* hidden from ambient shell values. Dedicated Google
  // constants bypass Vite's import.meta.env transform and are sourced only from
  // the isolated rehearsal file; regular builds retain their existing path.
  const rehearsalClientKeys = [
    'VITE_APP_ENV',
    'VITE_SUPABASE_TARGET',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PROJECT_REF',
    'VITE_PRODUCTION_SUPABASE_PROJECT_REF',
    'VITE_ALLOW_PRODUCTION_SUPABASE',
    'VITE_GOOGLE_IOS_CLIENT_ID',
    'VITE_GOOGLE_WEB_CLIENT_ID',
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_REVENUECAT_APPLE_API_KEY',
    'VITE_REVENUECAT_GOOGLE_API_KEY',
  ];
  const rehearsalDefinitions = isRehearsal
    ? {
        ...Object.fromEntries(
          rehearsalClientKeys.map((key) => ['import.meta.env.' + key, JSON.stringify(fileEnv[key] || '')]),
        ),
        'globalThis.__NMOOD_REHEARSAL_GOOGLE_CONFIG__': JSON.stringify({
          iOSClientId: fileEnv.VITE_GOOGLE_IOS_CLIENT_ID || '',
          webClientId: fileEnv.VITE_GOOGLE_WEB_CLIENT_ID || '',
        }),
      }
    : undefined;

  return {
    envDir,
    // Prevent ambient VITE_* shell variables from being auto-exposed during a
    // rehearsal build. The definitions above come only from its isolated file.
    envPrefix: isRehearsal ? 'NMOOD_REHEARSAL_INTERNAL_' : 'VITE_',
    define: { ...(isMainDevice ? { '__NMOOD_MAIN_DEVICE__': 'true', '__NMOOD_ISOLATED_APP_TEST__': 'false', '__NMOOD_ISOLATED_CUSTOMER_TEST__': 'false', '__NMOOD_PASSPORT_STATUS_TEST__': 'false', 'globalThis.__NMOOD_REHEARSAL_GOOGLE_CONFIG__': 'undefined' } : {}), ...rehearsalDefinitions, 'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(mapsKey), 'import.meta.env.VITE_BUILD_REVISION': JSON.stringify(process.env.NMOOD_BUILD_REVISION || 'development') },
    plugins: [react(), {name:'protected-maps-build-value',configResolved(config){config.env.VITE_GOOGLE_MAPS_API_KEY=mapsKey;}}],
    ...(!isMainDevice && !isRehearsal ? {build:{rollupOptions:{input:{app:fileURLToPath(new URL('./index.html',import.meta.url)),maps:fileURLToPath(new URL('./maps/index.html',import.meta.url))}}}} : {}),
    ...(isMainDevice ? { build: { rollupOptions: { treeshake: { moduleSideEffects: id => !/\/src\/lib\/(isolated-app|isolated-customer|passport-independent)\//.test(id) } } } } : {}),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      environmentOptions: {
        jsdom: { url: 'http://localhost/' },
      },
      setupFiles: ['./src/test-setup.js'],
      globals: false,
      include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
    },
  };
});
