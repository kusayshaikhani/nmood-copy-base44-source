import React from 'react';
import { motion } from 'framer-motion';
import { Eye, MessageSquare, Activity, Sparkles, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-024 — Premium privacy step. Data/select/switch logic unchanged.
function PrivacyRow({ icon: Icon, title, description, tone = 'bg-muted text-muted-foreground', children }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-card border border-border/50 bg-card shadow-soft">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${tone}`}>
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        <div className="mt-2.5">{children}</div>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange, tone }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-card border border-border/50 bg-card shadow-soft">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${tone}`}>
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold">{title}</p>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function PrivacyStep({ data, update, onNext }) {
  const { t } = useLocalization();
  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
      <div className="rounded-card bg-nmood-gradient/10 border border-primary/20 p-4 mb-5 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {t('onboarding.privacy.premium_intro')}
        </p>
      </div>

      <div className="space-y-3">
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <PrivacyRow
            icon={Eye}
            tone="bg-sky-500/10 text-sky-600 dark:text-sky-400"
            title={t('onboarding.privacy.visibility_title')}
            description={t('onboarding.privacy.visibility_desc')}
          >
            <Select value={data.profile_visibility || 'connections'} onValueChange={(v) => update({ profile_visibility: v })}>
              <SelectTrigger className="h-10 rounded-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{t('onboarding.privacy.visibility_public')}</SelectItem>
                <SelectItem value="connections">{t('onboarding.privacy.connections_only')}</SelectItem>
                <SelectItem value="private">{t('onboarding.privacy.visibility_private')}</SelectItem>
              </SelectContent>
            </Select>
          </PrivacyRow>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <PrivacyRow
            icon={MessageSquare}
            tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            title={t('onboarding.privacy.message_title')}
            description={t('onboarding.privacy.message_desc')}
          >
            <Select value={data.who_can_message || 'connections'} onValueChange={(v) => update({ who_can_message: v })}>
              <SelectTrigger className="h-10 rounded-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">{t('onboarding.privacy.everyone')}</SelectItem>
                <SelectItem value="connections">{t('onboarding.privacy.connections_only')}</SelectItem>
                <SelectItem value="no_one">{t('onboarding.privacy.no_one')}</SelectItem>
              </SelectContent>
            </Select>
          </PrivacyRow>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <ToggleRow
            icon={Activity}
            tone="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            title={t('onboarding.privacy.online_title')}
            description={t('onboarding.privacy.online_desc')}
            checked={data.show_online_status ?? true}
            onChange={(v) => update({ show_online_status: v })}
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <ToggleRow
            icon={Sparkles}
            tone="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
            title={t('onboarding.privacy.reco_title')}
            description={t('onboarding.privacy.reco_desc')}
            checked={data.personalized_recommendations ?? true}
            onChange={(v) => update({ personalized_recommendations: v })}
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <ToggleRow
            icon={BarChart3}
            tone="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            title={t('onboarding.privacy.analytics_title')}
            description={t('onboarding.privacy.analytics_desc')}
            checked={data.analytics_consent ?? false}
            onChange={(v) => update({ analytics_consent: v })}
          />
        </motion.div>
      </div>

      <Button className="w-full h-12 mt-6 shadow-elevated" onClick={onNext}>
        {t('common.continue')}
      </Button>
    </motion.div>
  );
}