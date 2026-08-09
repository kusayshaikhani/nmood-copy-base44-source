import React, { useState } from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Crown, AlertTriangle } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function TransferOwnershipSheet({ open, onOpenChange, members, onConfirm }) {
  const { t } = useLocalization();
  const [selected, setSelected] = useState(null);
  // Only regular members are eligible (not the current organizer).
  const eligible = (members || []).filter((m) => m.role !== 'organizer' && m.status === 'member');

  const confirm = () => {
    if (!selected) return;
    onConfirm?.(selected);
    setSelected(null);
    onOpenChange(false);
  };

  return (
    <BottomSheet open={open} onOpenChange={(o) => { if (!o) setSelected(null); onOpenChange(o); }} title={t('circles.transfer.title')}>
      <div className="space-y-3 pb-2">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('circles.transfer.desc')}
          </p>
        </div>

        {eligible.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">{t('circles.transfer.no_eligible')}</p>
        ) : (
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto no-scrollbar">
            {eligible.map((m) => {
              const on = selected?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-start transition-default ${on ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={m.member_avatar} alt={m.member_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{(m.member_name || '?').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.member_name}</p>
                    <p className="text-xs text-muted-foreground">Joined {m.joined_date || '—'}</p>
                  </div>
                  {on && <Crown className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        <Button className="w-full" disabled={!selected} onClick={confirm}>
          Transfer to {selected?.member_name || '…'}
        </Button>
      </div>
    </BottomSheet>
  );
}