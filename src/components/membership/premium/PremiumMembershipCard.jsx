import React from 'react';
import { Crown, Sparkles, Calendar, RefreshCw, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { PLANS, formatRenewalDate, getStatus } from '@/lib/membership-engine';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-023 — Beautiful current-plan card.
// Reads live membership state only; no subscription logic modified.
export default function PremiumMembershipCard({ onPrimary }) {
  const { t } = useLocalization();
  const { membership, isPremium } = useMembershipAccess();
  const plan = membership?.plan ? PLANS.find((p) => p.id === membership.plan) : null;
  const status = getStatus(membership);
  const renewal = formatRenewalDate(membership);

  const accent = isPremium
    ? 'from-primary/10 to-accent/10 border-primary/25'
    : 'from-muted/40 to-card border-border/60';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden rounded-card border bg-gradient-to-br ${accent} shadow-card`}
    >
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                isPremium ? 'bg-nmood-gradient text-white shadow-elevated' : 'bg-muted text-muted-foreground'
              }`}
            >
              {isPremium ? <Crown className="w-7 h-7" strokeWidth={1.75} /> : <Sparkles className="w-7 h-7" strokeWidth={1.75} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-xl font-bold leading-none">
                  {isPremium ? t('membership.premium') : t('membership.explorer')}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                    isPremium ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground mt-1.5 leading-snug">
                {isPremium ? t('membership.premium.you_are_premium_desc') : t('membership.premium.explorer_desc')}
              </p>
            </div>
          </div>
        </div>

        {isPremium && (
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Detail icon={Calendar} label={t('membership.premium.renewal_label')} value={renewal || '—'} />
            <Detail icon={RefreshCw} label={t('membership.premium.billing_label')} value={plan?.label || '—'} />
            <Detail icon={ShieldCheck} label={t('membership.premium.status_label')} value={membership?.auto_renew ? t('membership.renews_automatically') : t('membership.manual_renewal')} />
          </div>
        )}

        <button
          type="button"
          onClick={onPrimary}
          className={`mt-5 w-full h-12 rounded-button font-semibold text-[15px] transition-all active:scale-[0.98] ${
            isPremium
              ? 'bg-card border border-border text-foreground shadow-soft hover:bg-secondary'
              : 'bg-nmood-gradient text-primary-foreground shadow-card hover:shadow-elevated'
          }`}
        >
          {isPremium ? t('membership.premium.manage_subscription') : t('membership.premium.upgrade_cta')}
        </button>
      </div>
    </motion.div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-card/70 border border-border/50 px-3 py-2.5 text-center">
      <Icon className="w-4 h-4 mx-auto text-primary mb-1" strokeWidth={1.75} />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <p className="text-[12.5px] font-semibold mt-0.5 leading-tight truncate">{value}</p>
    </div>
  );
}