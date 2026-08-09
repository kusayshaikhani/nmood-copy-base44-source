import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Megaphone, Star, UsersRound, Radio, Download, ShieldAlert, X,
} from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ACTIONS = [
  { label: 'qa_create_announcement', icon: Megaphone, to: '/mission-control/notifications' },
  { label: 'qa_feature_experience', icon: Star, to: '/mission-control/community' },
  { label: 'qa_feature_circle', icon: UsersRound, to: '/mission-control/community' },
  { label: 'qa_send_broadcast', icon: Radio, to: '/mission-control/notifications' },
  { label: 'qa_export_analytics', icon: Download, to: '/mission-control/analytics' },
  { label: 'qa_open_moderation', icon: ShieldAlert, to: '/mission-control/trust-safety' },
];

export default function QuickActionsFab() {
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 md:bottom-6 end-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="rounded-card glass shadow-elevated p-3 w-64 animate-scale-in origin-bottom-right">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" /> {t('mission.quick_actions')}
            </p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-card/60 p-3 hover:bg-primary/10 hover:border-primary/30 transition-default"
              >
                <a.icon className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-medium text-center leading-tight">{t(`mission.${a.label}`)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('mission.quick_actions')}
        className="w-14 h-14 rounded-full bg-nmood-gradient text-white shadow-elevated flex items-center justify-center transition-default active:scale-95 hover:shadow-float"
      >
        <Zap className={`w-6 h-6 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
      </button>
    </div>
  );
}