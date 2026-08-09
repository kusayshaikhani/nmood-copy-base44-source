import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Eye, Mail, Check } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const privacyOptions = [
  {
    id: 'public',
    icon: Globe,
    titleKey: 'create.circle.privacy_public_title',
    descKey: 'create.circle.privacy_public_desc',
    tint: 'from-success/10 to-success/5',
    iconBg: 'bg-success/15 text-success',
  },
  {
    id: 'approval',
    icon: Eye,
    titleKey: 'create.circle.privacy_private_title',
    descKey: 'create.circle.privacy_private_desc',
    tint: 'from-primary/10 to-primary/5',
    iconBg: 'bg-primary/15 text-primary',
  },
  {
    id: 'invite',
    icon: Mail,
    titleKey: 'create.circle.privacy_hidden_title',
    descKey: 'create.circle.privacy_hidden_desc',
    tint: 'from-accent/15 to-accent/5',
    iconBg: 'bg-accent text-accent-foreground',
  },
];

/**
 * UI-021 — Circle Step 3: Privacy selection cards.
 * Public / Private (approval) / Hidden (invite only).
 * Reuses existing privacy logic — values map to Circle entity privacy enum.
 */
export default function CircleStepPrivacy({ data, update }) {
  const { t } = useLocalization();
  const current = data.privacy || 'public';

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('create.circle.privacy_title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('create.circle.privacy_subtitle')}</p>
      </div>

      <div className="space-y-3">
        {privacyOptions.map((opt, i) => {
          const Icon = opt.icon;
          const selected = current === opt.id;
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => update('privacy', opt.id)}
              type="button"
              className={`relative w-full flex items-center gap-4 p-5 rounded-card border-2 text-start transition-all overflow-hidden ${
                selected ? 'border-primary shadow-card' : 'border-border'
              }`}
            >
              {selected && (
                <div className={`absolute inset-0 bg-gradient-to-br ${opt.tint} pointer-events-none`} />
              )}
              <div className={`relative w-14 h-14 rounded-2xl ${opt.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="relative flex-1">
                <p className="font-bold text-base">{t(opt.titleKey)}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{t(opt.descKey)}</p>
              </div>
              <div className={`relative w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
              }`}>
                {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}