import React, { useState, useMemo } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { MCSection, MCLoadingState, MCErrorState } from '@/components/mission-control/ui';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import SmartImage from '@/components/shared/SmartImage';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsMediaLibrary() {
  const { t } = useLocalization();
  const { data, loading, error } = useMediaLibrary();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const items = useMemo(() => (data?.items || []).filter((it) => {
    if (cat !== 'all' && it.category !== cat) return false;
    if (q && !String(it.source || '').toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [data, q, cat]);

  if (loading) return <MCLoadingState rows={6} />;
  if (error) return <MCErrorState title={t('mission.media_unavailable')} description="Could not load media references." />;

  return (
    <MCSection icon={ImageIcon} title={t('mission.media_library')}
      action={<span className="text-xs text-muted-foreground">{data?.total || 0} assets</span>}>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('mission.search_by_source')} className="bg-card border rounded-lg text-sm px-3 py-1.5 flex-1 min-w-[200px]" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-card border rounded-lg text-sm px-2 py-1.5">
          <option value="all">{t('mission.all_types')}</option>
          <option value="member">{t('mission.member')}</option>
          <option value="experience">{t('mission.experience')}</option>
          <option value="circle">{t('mission.circle')}</option>
          <option value="brand">{t('mission.brand')}</option>
        </select>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.slice(0, 60).map((it, i) => (
          <a key={i} href={it.url} target="_blank" rel="noreferrer" className="group block rounded-lg overflow-hidden border bg-card/40">
            <div className="aspect-square"><SmartImage src={it.url} alt={it.source} className="w-full h-full object-cover" /></div>
            <div className="px-2 py-1.5"><p className="text-xs font-medium truncate">{it.source}</p><p className="text-[10px] text-muted-foreground capitalize">{it.category}</p></div>
          </a>
        ))}
      </div>
      {!items.length && <p className="text-sm text-muted-foreground text-center py-6">{t('mission.no_media_found')}</p>}
      <p className="text-xs text-muted-foreground/70 mt-3">{t('mission.readonly_preview_of_platform_media')}</p>
    </MCSection>
  );
}