import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Share2, Settings } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-017 — Own-profile action row: Edit, Share, Settings.
 * All three call parent handlers — no logic of its own.
 */
export default function ProfileActions({ onEdit, onShare, onSettings }) {
  const { t } = useLocalization();
  const actions = [
    { id: 'edit', icon: Pencil, label: t('profile.premium.actions.edit'), onClick: onEdit, primary: true },
    { id: 'share', icon: Share2, label: t('profile.premium.actions.share'), onClick: onShare, primary: false },
    { id: 'settings', icon: Settings, label: t('profile.premium.actions.settings'), onClick: onSettings, primary: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      className="px-4 sm:px-6 mt-4 flex gap-2"
    >
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            type="button"
            onClick={a.onClick}
            className={`flex-1 h-11 min-w-0 rounded-button flex items-center justify-center gap-1.5 text-[13px] sm:text-sm font-semibold active:scale-95 transition-transform px-2 sm:px-3 ${
              a.primary
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'bg-card border border-border/70 text-foreground shadow-soft'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{a.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}