import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, MessageCircle, UserMinus, Ban, Flag, EyeOff, BellOff } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PalCardMenu({ palName, onView, onMessage, onRemove, onBlock, onReport }) {
  const { t } = useLocalization();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="p-1.5 -mt-1 -me-1 rounded-lg hover:bg-muted transition-default">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="gap-2" onSelect={() => onView?.()}><Eye className="w-4 h-4" /> {t('connections.menu.view_profile')}</DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onSelect={() => onMessage?.()}><MessageCircle className="w-4 h-4" /> {t('connections.menu.message')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" disabled><EyeOff className="w-4 h-4" /> {t('connections.menu.hide_online')}</DropdownMenuItem>
        <DropdownMenuItem className="gap-2" disabled><BellOff className="w-4 h-4" /> {t('connections.menu.disable_invitations')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onSelect={() => onRemove?.()}><UserMinus className="w-4 h-4" /> {t('connections.menu.remove_pal')}</DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onSelect={() => onBlock?.()}><Ban className="w-4 h-4" /> {t('connections.menu.block_member')}</DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onSelect={() => onReport?.()}><Flag className="w-4 h-4" /> {t('connections.menu.report_member')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}