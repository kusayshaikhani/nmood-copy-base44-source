import React from 'react';
import { Copy, Share2, Users, XCircle, Trash2, X } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function HostActivityActions({ activity, open, onClose }) {
  const { t } = useLocalization();
  if (!open) return null;

  const isDraft = activity.status === 'draft';
  const isLive = activity.status === 'live';

  const actions = [
    { id: 'duplicate', label: 'Duplicate', icon: Copy },
    { id: 'share', label: 'Share', icon: Share2 },
    { id: 'manage', label: 'Manage Members', icon: Users },
  ];

  if (!isLive && !isDraft) {
    actions.push({ id: 'cancel', label: 'Cancel Experience', icon: XCircle, destructive: true });
  }
  if (isDraft) {
    actions.push({ id: 'delete', label: 'Delete Draft', icon: Trash2, destructive: true });
  }

  const btnClass = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-default text-start text-sm font-medium';

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full bg-card rounded-t-2xl p-4 pb-8"
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

        <div className="mb-3 px-2">
          <p className="text-xs font-medium text-muted-foreground truncate">{activity.title}</p>
        </div>

        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={onClose}
              className={btnClass + (action.destructive ? ' text-destructive' : '')}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </button>
          );
        })}

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-xl border border-border text-sm font-medium"
        >
          <X className="w-4 h-4" />
          {t('discovery.why.aria.close')}
        </button>
      </div>
    </div>
  );
}