import React, { useState, useEffect } from 'react';
import { Search, Loader2, Compass } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExperiencePickerSheet({ open, onOpenChange, onPick }) {
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
        const [att, hosted] = await Promise.all([
          base44.entities.Attendance.filter({ member_user_id: user.id, status: 'going' }, '-created_date', 50).catch(() => []),
          base44.entities.Experience.filter({ host_user_id: user.id, status: 'active' }, '-created_date', 50).catch(() => []),
        ]);
        const ids = new Set();
        const exps = [];
        for (const a of (att || [])) {
          if (a.experience_id && !ids.has(a.experience_id)) ids.add(a.experience_id);
        }
        for (const h of (hosted || [])) {
          if (h.id && !ids.has(h.id)) ids.add(h.id);
        }
        const fetched = [];
        for (const id of ids) {
          try {
            const r = await base44.entities.Experience.get(id);
            if (r && r.id) fetched.push(r);
          } catch { /* skip */ }
        }
        for (const h of (hosted || [])) {
          if (!fetched.find((f) => f.id === h.id)) fetched.push(h);
        }
        setItems(fetched.filter((e) => e.status !== 'cancelled' && !e.is_hidden));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, user?.id]);

  const filtered = items.filter((e) =>
    !q || (e.title || '').toLowerCase().includes(q.toLowerCase())
  );

  const when = (e) => [e.date, e.time].filter(Boolean).join(' · ');

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('messaging.composer.share_experience')}>
      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('messaging.composer.search_experiences')}
          className="w-full h-11 ps-9 pe-3 rounded-xl bg-muted text-sm focus:outline-none"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">{t('messaging.composer.no_experiences')}</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onPick({ id: e.id, title: e.title, cover_image: e.cover_image || '', when: when(e) })}
              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-muted transition-default text-start"
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {e.cover_image ? (
                  <img src={e.cover_image} alt={e.title} className="w-full h-full object-cover" />
                ) : (
                  <Compass className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground truncate">{when(e)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}