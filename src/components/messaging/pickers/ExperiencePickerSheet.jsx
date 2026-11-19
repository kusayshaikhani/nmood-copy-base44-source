import React, { useState, useEffect } from 'react';
import { Search, Loader2, Compass } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { listExperiences } from '@/api/contentRecords';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExperiencePickerSheet({ open, onOpenChange, onPick }) {
  const { t } = useLocalization();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const rows = await listExperiences({ limit: 100 });
        setItems(rows.filter((e) => e.status !== 'cancelled' && !e.is_hidden));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

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
