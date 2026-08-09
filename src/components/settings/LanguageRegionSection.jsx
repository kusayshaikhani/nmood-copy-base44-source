import React from 'react';
import { Globe, MessageSquare, Calendar, Clock, Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import SettingsRow from '@/components/settings/SettingsRow';
import { LANGUAGES } from '@/lib/i18n/languages';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * LOC-001 — Settings → Language & Region. Controls app language (instant,
 * no logout), preferred communication language, country/region, and regional
 * formatting. All labels run through the Localization Manager.
 *
 * UI-SETTINGS-014 — Uses the shared SettingsRow for consistent spacing.
 */
const TIMEZONES = [
  'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Bahrain', 'Asia/Muscat',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'America/New_York', 'America/Los_Angeles',
  'Asia/Kolkata', 'Asia/Karachi', 'Asia/Tehran', 'Asia/Jerusalem',
  'UTC',
];

const SELECT_CLASS = 'h-9 px-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-[45%]';

export default function LanguageRegionSection() {
  const { t, lang, setLang, settings, updateSettings } = useLocalization();
  let detectedTz;
  try {
    detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    detectedTz = 'UTC';
  }

  return (
    <div>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2.5 px-2">
        {t('settings.language_region')}
      </h2>
      <Card className="divide-y divide-border/60 rounded-card overflow-hidden">
        <SettingsRow icon={Globe} title={t('settings.app_language')} subtitle={t('settings.app_language_desc')}
          trailing={
            <select value={lang} onChange={(e) => setLang(e.target.value)} className={SELECT_CLASS}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.nativeName}</option>
              ))}
            </select>
          }
        />

        <SettingsRow icon={MessageSquare} title={t('settings.communication_language')} subtitle={t('settings.communication_language_desc')}
          trailing={
            <select
              value={settings.comm_language || lang}
              onChange={(e) => updateSettings({ comm_language: e.target.value })}
              className={SELECT_CLASS}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.nativeName}</option>
              ))}
            </select>
          }
        />

        <SettingsRow icon={Calendar} title={t('settings.date_format')}
          trailing={
            <select
              value={settings.date_format || 'medium'}
              onChange={(e) => updateSettings({ date_format: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="medium">{t('settings.date_format_medium')}</option>
              <option value="long">{t('settings.date_format_long')}</option>
              <option value="short">{t('settings.date_format_short')}</option>
            </select>
          }
        />

        <SettingsRow icon={Clock} title={t('settings.time_format')}
          trailing={
            <select
              value={settings.time_format || '12h'}
              onChange={(e) => updateSettings({ time_format: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="12h">{t('settings.time_format_12h')}</option>
              <option value="24h">{t('settings.time_format_24h')}</option>
            </select>
          }
        />

        <SettingsRow icon={Clock3} title={t('settings.timezone')}
          trailing={
            <select
              value={settings.timezone || detectedTz}
              onChange={(e) => updateSettings({ timezone: e.target.value })}
              className={SELECT_CLASS}
            >
              {[detectedTz, ...TIMEZONES.filter((tz) => tz !== detectedTz)].map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          }
        />
      </Card>
    </div>
  );
}