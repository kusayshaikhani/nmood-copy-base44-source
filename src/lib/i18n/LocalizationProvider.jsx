import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { getLanguage, detectDeviceLanguage, SUPPORTED_CODES } from './languages';
import { translations } from './translations';
import * as fmt from './format';
import './validate'; // MP-001 — dev-time key/structure validation (no-op in prod)

/**
 * LOC-001 — Centralized Localization Manager.
 * Single source of truth for: translations (t), language selection, regional
 * formatting, and persistence (device + cloud via the auth user record, so
 * preferences sync across devices/sessions without logout). Arabic is RTL;
 * all other supported languages are LTR.
 */
const STORAGE_KEY = 'nmood:lang';
const SETTINGS_KEY = 'nmood:locale-settings';

export const LocalizationContext = createContext(null);

function readStoredLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && SUPPORTED_CODES.has(v)) return v;
  } catch {
    /* storage unavailable */
  }
  return null;
}

function readStoredSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function LocalizationProvider({ children }) {
  const [lang, setLangState] = useState(() => readStoredLang() || detectDeviceLanguage() || 'en');
  const [settings, setSettings] = useState(() => readStoredSettings());

  // Apply lang to <html> and persist to device on every change. Arabic (ar)
  // is RTL; all other supported languages are LTR.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }, [lang]);

  // Sync cloud preference (User entity extra data) once auth is available —
  // keeps language consistent across devices without a schema change.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!active || !authed) return;
        const me = await base44.auth.me();
        const cloud = me?.app_language;
        if (cloud && SUPPORTED_CODES.has(cloud) && readStoredLang() !== cloud) {
          setLangState(cloud);
        }
        if (me) {
          setSettings((prev) => ({
            comm_language: me.comm_language ?? prev.comm_language,
            region: me.region ?? prev.region,
            date_format: me.date_format ?? prev.date_format,
            time_format: me.time_format ?? prev.time_format,
            timezone: me.timezone ?? prev.timezone,
            ...prev,
          }));
        }
      } catch {
        /* not logged in yet — device preference is used */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = translations[lang] || {};
      const enDict = translations.en || {};
      let str = dict[key] ?? enDict[key] ?? key;
      // MP-001 — ICU-style pluralization (runs before {var} interpolation;
      // plural branches use # for the count, never nested braces).
      str = fmt.resolvePlurals(str, lang, vars || {});
      if (vars) {
        Object.keys(vars).forEach((k) => {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
        });
      }
      return str;
    },
    [lang]
  );

  const setLang = useCallback(async (code) => {
    if (!SUPPORTED_CODES.has(code)) return;
    setLangState(code);
    try {
      const authed = await base44.auth.isAuthenticated();
      if (authed) await base44.auth.updateMe({ app_language: code });
    } catch {
      /* cloud sync best-effort */
    }
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (authed) await base44.auth.updateMe(patch);
      } catch {
        /* cloud sync best-effort */
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      lang,
      language: getLanguage(lang),
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      t,
      setLang,
      settings,
      updateSettings,
      formatDate: (d, opts) => fmt.date(d, lang, settings, opts),
      formatTime: (d, opts) => fmt.time(d, lang, settings, opts),
      formatNumber: (n, opts) => fmt.number(n, lang, opts),
      formatCurrency: (n, currencyCode, opts) => fmt.currency(n, lang, currencyCode, opts),
    }),
    [lang, t, setLang, settings, updateSettings]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}