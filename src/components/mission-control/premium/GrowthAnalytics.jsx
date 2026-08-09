import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart3, Globe, MapPin, Languages } from 'lucide-react';
import PremiumGlassCard from './PremiumGlassCard';
import { buildGrowthSeries } from './series';
import { useLocalization } from '@/lib/i18n/useLocalization';

const TOOLTIP = {
  contentStyle: {
    background: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 12,
    color: 'hsl(var(--popover-foreground))',
    fontSize: 12,
    boxShadow: 'var(--shadow-card)',
  },
  labelStyle: { color: 'hsl(var(--muted-foreground))', marginBottom: 4 },
  cursor: { fill: 'hsl(var(--muted) / 0.3)' },
};

function StatPill({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 px-3.5 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tracking-tight mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

const loc = (v) => (v && v.name ? `${v.name} (${v.count})` : '—');

export default function GrowthAnalytics({ members, experiences, circles, pulse, global, loading }) {
  const { t } = useLocalization();
  const data = useMemo(() => buildGrowthSeries(members, experiences, circles, 14), [members, experiences, circles]);

  const dau = pulse?.dau ?? 0;
  const wau = pulse?.wau ?? 0;
  const mau = pulse?.mau ?? 0;
  const premium = pulse?.premium ?? 0;
  const total = members.length || 1;
  const retention = mau > 0 ? Math.round((wau / mau) * 100) : 0;
  const conversion = total > 0 ? Math.round((premium / total) * 100) : 0;

  return (
    <PremiumGlassCard icon={BarChart3} title={t('mission.growth_active_users')} action={<Link to="/mission-control/analytics" className="text-xs text-primary hover:underline">{t('mission.open')}</Link>}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-5">
        <StatPill label="DAU" value={dau} />
        <StatPill label="WAU" value={wau} />
        <StatPill label="MAU" value={mau} />
        <StatPill label={t('mission.growth_retention')} value={`${retention}%`} sub="WAU/MAU" />
        <StatPill label={t('mission.growth_conversion')} value={`${conversion}%`} sub="Premium/Total" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{t('mission.growth_member_growth')}</p>
          <div className="h-[200px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="mcSignup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <Tooltip {...TOOLTIP} />
                <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" strokeWidth="2.5" fill="url(#mcSignup)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">{t('mission.growth_content_growth')}</p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-info" /> Exp</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent" /> Circles</span>
            </div>
          </div>
          <div className="h-[200px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="experiences" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} maxBarSize={14} />
                <Bar dataKey="circles" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {global && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5">
          <RegionRow icon={Globe} label={t('mission.regions_top_country')} value={loc(global.topCountry)} />
          <RegionRow icon={MapPin} label={t('mission.regions_top_city')} value={loc(global.topCity)} />
          <RegionRow icon={Languages} label={t('mission.regions_top_language')} value={loc(global.topLanguage)} />
        </div>
      )}
    </PremiumGlassCard>
  );
}

function RegionRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/60 px-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}