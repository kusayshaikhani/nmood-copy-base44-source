import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, Share2, EyeOff, Flag, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

const getWishlist = () => {
  try { return JSON.parse(localStorage.getItem('inmood_wishlist') || '[]'); } catch { return []; }
};

export default function InMoodCardMenu({ experience }) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleSave = () => {
    const list = getWishlist();
    const idStr = String(experience.id);
    if (list.includes(idStr)) {
      localStorage.setItem('inmood_wishlist', JSON.stringify(list.filter((x) => x !== idStr)));
      toast({ title: t('inmood.redesign.menu.save') + ' ✗' });
    } else {
      localStorage.setItem('inmood_wishlist', JSON.stringify([...list, idStr]));
      toast({ title: t('inmood.redesign.menu.save') + ' ✓' });
    }
  };

  const sharePlan = async () => {
    const url = `${window.location.origin}/experience/${experience.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: experience.title, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); toast({ title: t('inmood.redesign.menu.share') + ' ✓' }); } catch { /* ignore */ }
    }
  };

  const items = [
    { key: 'save', icon: Bookmark, label: t('inmood.redesign.menu.save'), onClick: toggleSave },
    { key: 'share', icon: Share2, label: t('inmood.redesign.menu.share'), onClick: sharePlan },
    { key: 'hide', icon: EyeOff, label: t('inmood.redesign.menu.hide'), onClick: () => toast({ title: t('inmood.redesign.menu.hide') }) },
    { key: 'report', icon: Flag, label: t('inmood.redesign.menu.report'), onClick: () => toast({ title: t('inmood.redesign.menu.report') }) },
    { key: 'not_interested', icon: ThumbsDown, label: t('inmood.redesign.menu.not_interested'), onClick: () => toast({ title: t('inmood.redesign.menu.not_interested') }) },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="More options"
        className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-default"
      >
        <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-border bg-popover shadow-elevated py-1 animate-scale-in origin-top-right">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={(e) => { e.stopPropagation(); item.onClick(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}