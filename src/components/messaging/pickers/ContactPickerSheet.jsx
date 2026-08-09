import React, { useState, useEffect } from 'react';
import { Search, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ContactPickerSheet({ open, onOpenChange, onPick }) {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [pals, setPals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open || !user?.id) return;
    setLoading(true);
    (async () => {
      try {
        const rows = await base44.entities.PalConnection.filter(
          { user_id: user.id, is_active: true },
          '-updated_date',
          100
        );
        setPals(rows || []);
      } catch {
        setPals([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, user?.id]);

  const filtered = pals.filter((p) =>
    !q || (p.pal_name || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('messaging.composer.share_contact')}>
      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('messaging.composer.search_pals')}
          className="w-full h-11 ps-9 pe-3 rounded-xl bg-muted text-sm focus:outline-none"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">{t('messaging.composer.no_pals')}</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick({ id: p.pal_user_id, name: p.pal_name, avatar: p.pal_avatar, bio: '' })}
              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-muted transition-default text-start"
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={p.pal_avatar} alt={p.pal_name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {(p.pal_name || '?').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate flex-1">{p.pal_name}</span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}