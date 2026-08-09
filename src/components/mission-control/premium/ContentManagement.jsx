import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid, Calendar, UsersRound, Megaphone, Star, ChevronRight,
} from 'lucide-react';
import PremiumGlassCard from './PremiumGlassCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

function ContentCard({ icon: Icon, label, value, sub, to, tone = 'primary' }) {
  const { t } = useLocalization();
  const tones = {
    primary: 'bg-primary/12 text-primary ring-primary/20',
    info: 'bg-info/12 text-info ring-info/20',
    accent: 'bg-accent/25 text-accent-foreground ring-accent/30',
    warning: 'bg-warning/12 text-warning ring-warning/20',
  };
  return (
    <Link to={to} className={`pressable rounded-xl border border-border/50 bg-card/60 p-4 ring-1 ${tones[tone]} flex flex-col hover:border-primary/30 transition-default`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <p className="text-sm font-semibold mt-3">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
        {t('mission.content_manage')} <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}

export default function ContentManagement({ experiences, circles, loading }) {
  const { t } = useLocalization();
  const featuredExp = experiences.filter((e) => e.is_featured).length;
  const activeCircles = circles.filter((c) => c.status !== 'closed' && !c.is_archived).length;

  return (
    <PremiumGlassCard icon={LayoutGrid} title={t('mission.content_management')} action={<Link to="/mission-control/community" className="text-xs text-primary hover:underline">{t('mission.open')}</Link>}>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-32 shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <ContentCard icon={Calendar} label={t('mission.content_experiences')} value={experiences.length} sub={`${featuredExp} ${t('mission.content_featured')}`} to="/mission-control/community" tone="primary" />
          <ContentCard icon={UsersRound} label={t('mission.content_circles')} value={circles.length} sub={`${activeCircles} active`} to="/mission-control/community" tone="info" />
          <ContentCard icon={Megaphone} label={t('mission.content_announcements')} value="—" sub={t('mission.content_manage')} to="/mission-control/notifications" tone="warning" />
          <ContentCard icon={Star} label={t('mission.content_featured_experiences')} value={featuredExp} to="/mission-control/community" tone="accent" />
          <ContentCard icon={Star} label={t('mission.content_featured_circles')} value={circles.filter((c) => c.is_featured).length} to="/mission-control/community" tone="accent" />
        </div>
      )}
    </PremiumGlassCard>
  );
}