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
 * The rehearsal Hard Delete is appended only after the Supabase admin check.
 * Deleted members expose only View Profile, Restore, and Hard Delete —
 * Edit / Upgrade / Reset actions are hidden for them. Production actions are
 * unchanged for all other statuses.
 */
export default function MCMemberActionsMenu({ member, tier, onAction, showHardDelete, showPermanentDelete = false, showComplimentary = false }) {
  const { t } = useLocalization();
  const status = member.admin_status || 'active';
  const isDeleted = status === 'deleted';

  const permanentAction = showPermanentDelete ? [{ separator: true, icon: Trash2, variant: 'destructive', label: 'Permanently Delete Member', onClick: () => onAction(member, 'permanentDelete') }] : [];
  const hardDeleteAction = showHardDelete
    ? [{
        separator: true,
        icon: Trash2,
        variant: 'destructive',
        label: (
          <span className="flex items-center justify-between w-full gap-2">
            <span>{t('mission.hard_delete')}</span>
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">Rehearsal</span>
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
          ...hardDeleteAction,
          ...permanentAction,
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
    ...(showComplimentary ? [{ icon: Crown, label: 'Complimentary Premium', onClick: () => onAction(member, 'complimentary') }] : []),
    ...(!showComplimentary && tier !== 'premium' ? [{ icon: Crown, label: 'Upgrade to Premium', onClick: () => onAction(member, 'upgrade') }] : []),
    ...(!showComplimentary && tier === 'premium' ? [{ icon: TrendingDown, label: 'Downgrade to Explorer', variant: 'destructive', onClick: () => onAction(member, 'downgrade') }] : []),
    { separator: true },
    ...(status === 'active' ? [{ icon: Ban, label: 'Suspend', variant: 'destructive', onClick: () => onAction(member, 'suspend') }] : []),
    ...(status === 'active' ? [{ icon: PowerOff, label: 'Ban', variant: 'destructive', onClick: () => onAction(member, 'ban') }] : []),
    ...(status === 'suspended' || status === 'deactivated' ? [{ icon: Unlock, label: 'Reactivate', onClick: () => onAction(member, 'reactivate') }] : []),
    ...(status === 'banned' ? [{ icon: Unlock, label: 'Unban', onClick: () => onAction(member, 'unban') }] : []),
    ...(status !== 'deleted' ? [{ icon: Trash2, label: 'Soft Delete', variant: 'destructive', onClick: () => onAction(member, 'softDelete') }] : []),
    { separator: true },
    { icon: LogOut, label: 'Force Logout', variant: 'destructive', onClick: () => onAction(member, 'forceLogout') },
    ...hardDeleteAction,
          ...permanentAction,
  ];
  return <AdminRowActions actions={actions} />;
}