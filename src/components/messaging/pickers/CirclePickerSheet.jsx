import React, { useState, useEffect } from 'react';
import { Search, Loader2, Users } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CirclePickerSheet({ open, onOpenChange, onPick }) {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open || !user?.id) return;
    setLoading(true);
    (async () => {
      try {
        const memberships = await base44.entities.CircleMembership.filter(
          { member_user_id: user.id, status: 'member' },
          '-created_date',
          100
        );
        const ids = new Set((memberships || []).map((m) => m.circle_id));
        const fetched = [];
        for (const id of ids) {
          try {
            const r = await base44.entities.Circle.get(id);
            if (r && r.id && r.status === 'active' && !r.is_hidden) fetched.push(r);
          } catch { /* skip */ }
        }
        setItems(fetched);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, user?.id]);

  const filtered = items.filter((c) =>
    !q || (c.name || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('messaging.composer.share_circle')}>
      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('messaging.composer.search_circles')}
          className="w-full h-11 ps-9 pe-3 rounded-xl bg-muted text-sm focus:outline-none"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">{t('messaging.composer.no_circles')}</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick({ id: c.id, name: c.name, cover_photo: c.cover_photo || '', member_count: c.member_count || 0 })}
              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-muted transition-default text-start"
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {c.cover_photo ? (
                  <img src={c.cover_photo} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">{t('messaging.share.members', { count: c.member_count || 0 })}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}