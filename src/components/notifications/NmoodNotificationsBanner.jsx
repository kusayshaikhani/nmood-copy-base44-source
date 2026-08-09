import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { getNmoodNotifications } from '@/lib/nmood-recommendations';

export default function NmoodNotificationsBanner() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const notifications = getNmoodNotifications();
  if (notifications.length === 0) return null;

  return (
    <div className="mb-7">
      <h3 className="text-sm font-semibold mb-3">{t('nmoods.notif.section_title')}</h3>
      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => n.nmoodId && navigate(`/nmood/${n.nmoodId}`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:shadow-sm transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{t(`nmoods.notif.${n.type}.title`)}</p>
              <p className="text-xs text-muted-foreground leading-snug">{t(`nmoods.notif.${n.type}.body`)}</p>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{n.time}</span>
          </button>
        ))}
      </div>
    </div>
  );
}