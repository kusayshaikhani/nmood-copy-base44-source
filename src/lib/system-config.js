// F-003 Centralized system configuration + branding.
// Single source of truth for app name, slogan, contact, build info.
// Admin overrides live in the SystemConfig entity (editable without redeploy);
// these defaults are the fallback and the compile-time source.

import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ENVIRONMENT as DETECTED_ENV } from './runtime-env';

export const APP_VERSION = '1.0.1';
export const BUILD_NUMBER = '20260804.1';
export const ENVIRONMENT = DETECTED_ENV;
export const BUILD_DATE = '2026-08-04T16:00:00.000Z';
export const COMMIT_ID = import.meta.env?.VITE_COMMIT_ID || '';

// SEC-001A — phone registration is disabled until SMS verification is live.
// Retained behind this flag for future activation; production shows email only.
export const PHONE_REGISTRATION_ENABLED = false;

// Brand constants — the ONLY place the slogan string literal lives.
export const BRAND = {
  app_name: 'Nmood',
  slogan_line_1: 'Zero swipes.',
  slogan_line_2: 'Authentic connection.',
  slogan_inline: 'Zero swipes. Authentic connection.',
  app_store_subtitle: 'Zero swipes. Authentic connection.',
  short_positioning: 'Nmood replaces swiping with meaningful real-world connections built through shared moods, interests, circles, and experiences.',
};

export const DEFAULT_CONFIG = {
  app_name: BRAND.app_name,
  slogan_line_1: BRAND.slogan_line_1,
  slogan_line_2: BRAND.slogan_line_2,
  slogan_inline: BRAND.slogan_inline,
  app_store_subtitle: BRAND.app_store_subtitle,
  short_positioning: BRAND.short_positioning,
  support_email: 'support@nmood.app',
  contact_email: 'hello@nmood.app',
  business_email: 'business@nmood.app',
  contact_phone: '',
  version: APP_VERSION,
  build_number: BUILD_NUMBER,
  environment: ENVIRONMENT,
  // SEC-001A — phone registration gated behind SMS provider availability.
  phone_registration_enabled: false,
  terms_url: 'https://app.nmood.app/terms',
  privacy_url: 'https://app.nmood.app/privacy',
};

let cache = null;
let inflight = null;

export async function loadSystemConfig(force = false) {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = base44.functions
    .invoke('systemOps', { mode: 'getConfig' })
    .then((res) => {
      cache = { ...DEFAULT_CONFIG, ...(res?.config || {}) };
      return cache;
    })
    .catch(() => {
      cache = DEFAULT_CONFIG;
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useSystemConfig() {
  const [config, setConfig] = useState(cache || DEFAULT_CONFIG);
  useEffect(() => {
    loadSystemConfig().then(setConfig);
  }, []);
  return config;
}

export function getSloganLines(config = DEFAULT_CONFIG) {
  return [config.slogan_line_1 || BRAND.slogan_line_1, config.slogan_line_2 || BRAND.slogan_line_2];
}
