import React from 'react';
import {
  Eye, Pencil, ShieldOff, RefreshCw, Crown, TrendingDown, Ban, Unlock, PowerOff, Trash2, History, LogOut,
} from 'lucide-react';
import AdminRowActions from '@/components/admin/AdminRowActions';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * FM-003 — Contextual member admin actions. Destructive items surface a
 * destructive style; the page wires every action through a confirmation dialog.
 *
 * DEV-001 — The temporary development-only Hard Delete is appended when
 * `showDevHardDelete` is true (server-gated by APP_ENV + founder identity).
 * Deleted members expose only View Profile, Restore, and (in dev) Hard Delete —
 * Edit / Upgrade / Reset actions are hidden for them. Production actions are
 * unchanged for all other statuses.
 */
export default function MCMemberActionsMenu({ member, tier, onAction, showDevHardDelete }) {
  const { t } = useLocalization();
  const status = member.admin_status || 'active';
  const isDeleted = status === 'deleted';

  const devHardDeleteAction = showDevHardDelete
    ? [{
        separator: true,
        icon: Trash2,
        variant: 'destructive',
        label: (
          <span className="flex items-center justify-between w-full gap-2">
            <span>{t('mission.hard_delete')}</span>
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">{t('mission.dev_only')}</span>
          </span>
        ),
        onClick: () => onAction(member, 'hardDelete'),
      }]
    : [];

  if (isDeleted) {
    // Deleted members: View Profile, Restore, then Hard Delete (dev only).
    return (
      <AdminRowActions
        actions={[
          { icon: Eye, label: 'View Profile', onClick: () => onAction(member, 'view') },
          { separator: true },
          { icon: History, label: 'Restore', onClick: () => onAction(member, 'restore') },
          ...devHardDeleteAction,
        ]}
      />
    );
  }

  const actions = [
    { icon: Eye, label: 'View Profile', onClick: () => onAction(member, 'view') },
    { icon: Pencil, label: 'Edit Profile', onClick: () => onAction(member, 'edit') },
    { separator: true },
    { icon: ShieldOff, label: 'Reset Verification', variant: 'destructive', onClick: () => onAction(member, 'resetVerification') },
    { icon: RefreshCw, label: 'Reset Profile Completion', onClick: () => onAction(member, 'resetCompletion') },
    { separator: true },
    ...(tier !== 'premium' ? [{ icon: Crown, label: 'Upgrade to Premium', onClick: () => onAction(member, 'upgrade') }] : []),
    ...(tier === 'premium' ? [{ icon: TrendingDown, label: 'Downgrade to Explorer', variant: 'destructive', onClick: () => onAction(member, 'downgrade') }] : []),
    { separator: true },
    ...(status === 'active' ? [{ icon: Ban, label: 'Suspend', variant: 'destructive', onClick: () => onAction(member, 'suspend') }] : []),
    ...(status === 'active' ? [{ icon: PowerOff, label: 'Ban', variant: 'destructive', onClick: () => onAction(member, 'ban') }] : []),
    ...(status === 'suspended' || status === 'deactivated' ? [{ icon: Unlock, label: 'Reactivate', onClick: () => onAction(member, 'reactivate') }] : []),
    ...(status === 'banned' ? [{ icon: Unlock, label: 'Unban', onClick: () => onAction(member, 'unban') }] : []),
    ...(status !== 'deleted' ? [{ icon: Trash2, label: 'Soft Delete', variant: 'destructive', onClick: () => onAction(member, 'softDelete') }] : []),
    { separator: true },
    { icon: LogOut, label: 'Force Logout', variant: 'destructive', onClick: () => onAction(member, 'forceLogout') },
    ...devHardDeleteAction,
  ];
  return <AdminRowActions actions={actions} />;
}