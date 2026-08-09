import React, { useMemo, useState } from 'react';
import {
  BarChart3, RefreshCw, LayoutDashboard, TrendingUp, Crown, Activity, Globe,
  Languages, Sparkles, Lightbulb, FileBarChart, Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBiData } from '@/hooks/useBiData';
import {
  computeOverview, computeGrowth, computeMembership, computeEngagement,
  computeGeographic, computeLanguage, computeInterest, computeInsights,
} from '@/lib/bi-metrics';
import { MCModuleHeader, MCErrorState, MCLoadingState } from '@/components/mission-control/ui';
import BiFilterBar from './BiFilterBar';
import BiOverview from './BiOverview';
import BiGrowth from './BiGrowth';
import BiMembership from './BiMembership';
import BiEngagement from './BiEngagement';
import BiGeographic from './BiGeographic';
import BiLanguage from './BiLanguage';
import BiInterest from './BiInterest';
import BiInsights from './BiInsights';
import BiReportBuilder from './BiReportBuilder';
import BiComingSoon from './BiComingSoon';
import { useLocalization } from '@/lib/i18n/useLocalization';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'membership', label: 'Membership', icon: Crown },
  { id: 'engagement', label: 'Engagement', icon: Activity },
  { id: 'geographic', label: 'Geographic', icon: Globe },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'interest', label: 'Interest', icon: Sparkles },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'future', label: 'Future', icon: Rocket },
];

/**
 * FM-010 — Business Intelligence Center.
 * Unifies Analytics, Countries, Languages and Revenue into one executive
 * dashboard. Admin-only (gated by FounderRoute + adminConsole verification).
 */
export default function BusinessIntelligenceCenter() {
  const { t } = useLocalization();
  const { data, loading, error, refresh } = useBiData();
  const [tab, setTab] = useState('overview');
  const [range, setRange] = useState(30);
  const [country, setCountry] = useState('all');
  const [city, setCity] = useState('all');
  const [membership, setMembership] = useState('all');
  const [language, setLanguage] = useState('all');
  const [interest, setInterest] = useState('all');
  const [expCategory, setExpCategory] = useState('all');
  const [circleCategory, setCircleCategory] = useState('all');

  const options = useMemo(() => {
    const m = data?.members || [];
    const inCountry = (x) => country === 'all' || x.country === country;
    return {
      countries: [...new Set(m.map((x) => x.country).filter(Boolean))].sort(),
      cities: [...new Set(m.filter(inCountry).map((x) => x.city).filter(Boolean))].sort(),
      languages: [...new Set(m.flatMap((x) => x.languages || []))].sort(),
      interests: [...new Set(m.flatMap((x) => x.interests || []))].sort(),
      expCategories: [...new Set((data?.experiences || []).map((x) => x.category).filter(Boolean))].sort(),
      circleCategories: [...new Set((data?.circles || []).map((x) => x.category).filter(Boolean))].sort(),
    };
  }, [data, country]);

  const filtered = useMemo(() => {
    if (!data) return null;
    const premIds = new Set((data.memberships || []).filter((x) => x.type === 'premium' && x.status === 'active').map((x) => x.user_id).filter(Boolean));
    const expIds = new Set((data.memberships || []).filter((x) => x.type === 'explorer').map((x) => x.user_id).filter(Boolean));
    const members = (data.members || []).filter((m) => {
      if (country !== 'all' && m.country !== country) return false;
      if (city !== 'all' && m.city !== city) return false;
      if (language !== 'all' && !(m.languages || []).includes(language)) return false;
      if (interest !== 'all' && !(m.interests || []).includes(interest)) return false;
      if (membership === 'premium' && !premIds.has(m.created_by_id)) return false;
      if (membership === 'explorer' && !expIds.has(m.created_by_id)) return false;
      return true;
    });
    const experiences = (data.experiences || []).filter((e) => expCategory === 'all' || e.category === expCategory);
    const circles = (data.circles || []).filter((c) => circleCategory === 'all' || c.category === circleCategory);
    return { ...data, members, experiences, circles };
  }, [data, country, city, language, interest, membership, expCategory, circleCategory]);

  const metrics = useMemo(() => {
    if (!filtered) return null;
    return {
      overview: computeOverview(filtered),
      growth: computeGrowth(filtered, range),
      membership: computeMembership(filtered),
      engagement: computeEngagement(filtered),
      geographic: computeGeographic(filtered),
      language: computeLanguage(filtered),
      interest: computeInterest(filtered),
      insights: computeInsights(filtered),
    };
  }, [filtered, range]);

  if (loading) {
    return <div className="max-w-[1400px] mx-auto pb-10"><MCLoadingState rows={10} /></div>;
  }
  if (error) {
    return <MCErrorState title={t('mission.business_intelligence_unavailable')} description="We couldn't load analytics data. Please try again." onRetry={refresh} />;
  }
  if (!data || !metrics) {
    return <MCErrorState title={t('admin.no_data_available')} description="No analytics data is available yet." />;
  }

  const filters = { range, country, city, membership, language, interest, expCategory, circleCategory };

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader
        icon={BarChart3}
        title={t('mission.business_intelligence')}
        description="Platform analytics, growth, localization & regional intelligence."
        breadcrumb={[{ label: 'Business Intelligence' }]}
      />
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-default',
                  tab === t.id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/40"
          aria-label={t('mission.refresh_business_intelligence_data')}
        >
          <RefreshCw className="w-4 h-4" /> {t('admin.refresh')}
        </button>
      </div>

      <BiFilterBar
        range={range} setRange={setRange}
        country={country} setCountry={setCountry}
        city={city} setCity={setCity}
        membership={membership} setMembership={setMembership}
        language={language} setLanguage={setLanguage}
        interest={interest} setInterest={setInterest}
        expCategory={expCategory} setExpCategory={setExpCategory}
        circleCategory={circleCategory} setCircleCategory={setCircleCategory}
        options={options}
      />

      <div className="mt-4">
        {tab === 'overview' && <BiOverview overview={metrics.overview} />}
        {tab === 'growth' && <BiGrowth growth={metrics.growth} />}
        {tab === 'membership' && <BiMembership membership={metrics.membership} />}
        {tab === 'engagement' && <BiEngagement engagement={metrics.engagement} />}
        {tab === 'geographic' && <BiGeographic geographic={metrics.geographic} />}
        {tab === 'language' && <BiLanguage language={metrics.language} />}
        {tab === 'interest' && <BiInterest interest={metrics.interest} />}
        {tab === 'insights' && <BiInsights insights={metrics.insights} />}
        {tab === 'reports' && <BiReportBuilder data={filtered} metrics={metrics} filters={filters} />}
        {tab === 'future' && <BiComingSoon />}
      </div>
    </div>
  );
}