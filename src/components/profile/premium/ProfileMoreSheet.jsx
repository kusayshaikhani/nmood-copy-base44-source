import React from 'react';
import { Settings, ShieldCheck, Info, LogOut } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-017 — "More" bottom sheet: Settings, Safety Center, About, Logout.
 * Preserves all navigation from the original account footer.
 */
export default function ProfileMoreSheet({ open, onOpenChange, onSettings, onSafety, onAbout, onLogout }) {
  const { t } = useLocalization();
  const items = [
    { id: 'settings', icon: Settings, label: t('profile.premium.more.settings'), onClick: onSettings, destructive: false },
    { id: 'safety', icon: ShieldCheck, label: t('profile.premium.more.safety'), onClick: onSafety, destructive: false },
    { id: 'about', icon: Info, label: t('profile.premium.more.about'), onClick: onAbout, destructive: false },
    { id: 'logout', icon: LogOut, label: t('profile.premium.more.logout'), onClick: onLogout, destructive: true },
  ];

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('profile.premium.more.title')}>
      <div className="space-y-1 pb-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => { onOpenChange(false); it.onClick?.(); }}
              className={`flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-muted transition-default text-left ${it.destructive ? 'text-destructive' : ''}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${it.destructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <Icon className={`w-5 h-5 ${it.destructive ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <span className="text-sm font-medium">{it.label}</span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}