import React from 'react';
import { Users, Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={'px-2.5 py-1 rounded-full text-xs border transition-default ' +
        (active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50')}>
      {children}
    </button>
  );
}
function Field({ label, children }) {
  return <label className="flex flex-col gap-1 text-xs"><span className="font-medium text-muted-foreground">{label}</span>{children}</label>;
}
function MultiSelect({ values, options, onChange }) {
  const { t } = useLocalization();
  if (!options.length) return <p className="text-xs text-muted-foreground/60">{t('mission.no_options_available')}</p>;
  const toggle = (v) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return <div className="flex flex-wrap gap-1.5">{options.map((o) => <Chip key={o.value} active={values.includes(o.value)} onClick={() => toggle(o.value)}>{o.label}</Chip>)}</div>;
}

export default function AudienceTargeting({ filters, onChange, options, estimate, estimating }) {
  const { t } = useLocalization();
  const f = filters || {};
  const set = (k, v) => onChange({ ...f, [k]: v });
  const arr = (k) => (Array.isArray(f[k]) ? f[k] : []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Country"><div className="max-h-24 overflow-y-auto pr-1"><MultiSelect values={arr('countries')} options={options.countries} onChange={(v) => set('countries', v)} /></div></Field>
        <Field label="City"><div className="max-h-24 overflow-y-auto pr-1"><MultiSelect values={arr('cities')} options={options.cities} onChange={(v) => set('cities', v)} /></div></Field>
        <Field label="Language"><div className="max-h-24 overflow-y-auto pr-1"><MultiSelect values={arr('languages')} options={options.languages} onChange={(v) => set('languages', v)} /></div></Field>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Membership">
          <select value={f.membership || 'all'} onChange={(e) => set('membership', e.target.value)} className="h-9 px-3 rounded-lg bg-card border border-border text-sm">
            <option value="all">{t('mission.all')}</option><option value="explorer">{t('mission.explorer')}</option><option value="premium">{t('mission.premium')}</option>
          </select>
        </Field>
        <Field label="Verification">
          <select value={f.verification || 'all'} onChange={(e) => set('verification', e.target.value)} className="h-9 px-3 rounded-lg bg-card border border-border text-sm">
            <option value="all">{t('mission.all')}</option><option value="verified">{t('mission.verified')}</option><option value="unverified">{t('mission.unverified')}</option>
          </select>
        </Field>
        <Field label="Trust Score">
          <select value={f.trustScore || 'all'} onChange={(e) => set('trustScore', e.target.value)} className="h-9 px-3 rounded-lg bg-card border border-border text-sm">
            <option value="all">{t('mission.all_scores')}</option><option value="high">{t('mission.high_future')}</option><option value="medium">{t('mission.medium_future')}</option>
          </select>
        </Field>
        <div className="flex items-end gap-4 pb-1">
          <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!f.recentlyActive} onChange={(e) => set('recentlyActive', e.target.checked || undefined)} className="accent-primary" /> {t('mission.recently_active')}</label>
          <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!f.online} onChange={(e) => set('online', e.target.checked || undefined)} className="accent-primary" /> {t('mission.online_now')}</label>
        </div>
      </div>
      <Field label="Interests"><MultiSelect values={arr('interests')} options={options.interests} onChange={(v) => set('interests', v)} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Joined Circles"><div className="max-h-24 overflow-y-auto pr-1"><MultiSelect values={arr('circles')} options={options.circles} onChange={(v) => set('circles', v)} /></div></Field>
        <Field label="Joined Experiences"><div className="max-h-24 overflow-y-auto pr-1"><MultiSelect values={arr('experiences')} options={options.experiences} onChange={(v) => set('experiences', v)} /></div></Field>
      </div>
      <Field label="Custom Member IDs (comma-separated)">
        <input value={arr('customMembers').join(', ')} onChange={(e) => set('customMembers', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          placeholder={t('mission.id1_id2')} className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </Field>
      <div className="flex items-center justify-between rounded-lg border bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-primary" /><span className="font-medium">{t('mission.estimated_audience')}</span></div>
        <div className="flex items-center gap-2">
          {estimating ? <Sparkles className="w-4 h-4 text-primary animate-pulse" /> : null}
          <span className="text-xl font-bold">{estimate}</span>
          <span className="text-xs text-muted-foreground">{t('mission.members')}</span>
        </div>
      </div>
    </div>
  );
}