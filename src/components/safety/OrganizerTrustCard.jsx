import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, CheckCircle, Calendar, TrendingUp, Award, Flag, CheckCheck } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * PB-002 — Displays real organizer trust metrics calculated from live data.
 *
 * Props:
 *  - trust:   object from useOrganizerTrust() — null means insufficient data
 *  - loading: boolean from useOrganizerTrust()
 *
 * When trust is null (0 hosted experiences) shows "Not enough activity yet."
 * Never displays fabricated percentages or ratings.
 */
export default function OrganizerTrustCard({ trust, loading, showHeader = true }) {
  const { t } = useLocalization();

  if (loading) {
    return (
      <Card className="p-4">
        {showHeader && (
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-warning" />
            <h3 className="font-semibold text-sm">{t('safety.organizer_trust')}</h3>
          </div>
        )}
        <div className="h-12 rounded-xl shimmer mb-3" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 rounded-xl shimmer" />
          <div className="h-16 rounded-xl shimmer" />
          <div className="h-16 rounded-xl shimmer" />
          <div className="h-16 rounded-xl shimmer" />
        </div>
      </Card>
    );
  }

  if (!trust) {
    return (
      <Card className="p-4">
        {showHeader && (
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-warning" />
            <h3 className="font-semibold text-sm">{t('safety.organizer_trust')}</h3>
          </div>
        )}
        <div className="flex flex-col items-center text-center py-4">
          <Crown className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">{t('safety.organizer.not_enough_activity')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {showHeader && (
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-warning" />
          <h3 className="font-semibold text-sm">{t('safety.organizer_trust')}</h3>
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm">
              {trust.verified
                ? t('experiences.safety.verified')
                : t('experiences.safety.unverified')}
            </p>
            {trust.verified && (
              <Badge className="bg-success/10 text-success hover:bg-success/10 text-[10px] gap-0.5 px-1.5">
                <CheckCircle className="w-2.5 h-2.5" /> {t('safety.organizer.verified_badge')}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MetricCell icon={Calendar} label={t('safety.organizer.hosted')} value={trust.experiencesHosted} />
        <MetricCell icon={CheckCheck} label={t('safety.organizer.completed')} value={trust.completedExperiences} />
        <MetricCell icon={TrendingUp} label={t('safety.organizer.completion_rate')} value={`${trust.completionRate}%`} />
        <MetricCell
          icon={Star}
          iconClass="text-warning"
          label={t('safety.organizer.avg_rating')}
          value={trust.averageRating !== null ? trust.averageRating : '—'}
        />
        <MetricCell icon={Flag} label={t('safety.organizer.reports')} value={trust.reportsReceived} />
        <MetricCell icon={Award} label={t('profile.info.member_since')} value={trust.memberSince || '—'} small />
      </div>
    </Card>
  );
}

function MetricCell({ icon: Icon, iconClass, label, value, small }) {
  return (
    <div className="p-2.5 rounded-xl bg-muted/40">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className={`w-3 h-3 ${iconClass || 'text-muted-foreground'}`} />
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
      <p className={`${small ? 'text-sm pt-1.5' : 'text-lg'} font-bold`}>{value}</p>
    </div>
  );
}