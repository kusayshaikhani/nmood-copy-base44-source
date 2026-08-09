import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { feedback } from '@/lib/feedback';

const STORAGE_KEY = 'nmood:recent_gifs';
const MAX_GIF = 8 * 1024 * 1024;

export default function GifPickerSheet({ open, onOpenChange, onPick }) {
  const { t } = useLocalization();
  const [recents, setRecents] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    try {
      setRecents(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {
      setRecents([]);
    }
  }, [open]);

  const persist = (list) => {
    setRecents(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 24))); } catch { /* ignore */ }
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { feedback.message(t('messaging.composer.gif_invalid')); return; }
    if (file.size > MAX_GIF) { feedback.message(t('messaging.composer.gif_too_large')); return; }
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const url = res?.file_url || '';
      if (url) {
        persist([{ url, addedAt: Date.now() }, ...recents].slice(0, 24));
        onPick(url);
      }
    } catch {
      feedback.error(new Error(t('messaging.composer.upload_failed')));
    } finally {
      setUploading(false);
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('messaging.composer.gif_title')}>
      <div className="mb-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 w-full h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {t('messaging.composer.upload_gif')}
        </button>
        <input ref={fileInput} type="file" accept="image/gif,image/webp,image/png" className="hidden" onChange={onPickFile} />
      </div>
      {recents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">{t('messaging.composer.gif_empty')}</p>
        </div>
      ) : (
        <>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('messaging.composer.recent_gifs')}</p>
          <div className="grid grid-cols-3 gap-2">
            {recents.map((g) => (
              <button
                key={g.url + g.addedAt}
                type="button"
                onClick={() => onPick(g.url)}
                className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center hover:opacity-80 transition-default"
              >
                <img src={g.url} alt="GIF" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  );
}