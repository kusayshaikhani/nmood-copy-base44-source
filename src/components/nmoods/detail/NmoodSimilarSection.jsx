import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NmoodSimilarSection({ nmoods }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  if (!nmoods || nmoods.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{t('nmoods.detail.similar')}</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain -mx-5 px-5 pb-1">
        {nmoods.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => navigate(`/nmood/${n.id}`)}
            className="shrink-0 w-40 text-left rounded-xl border border-border bg-card p-3 hover:border-primary/30 hover:shadow-card transition-all"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-lg leading-none">{n.category_icon}</span>
              <span className="text-[11px] text-muted-foreground">{n.category}</span>
            </div>
            <p className="text-xs font-medium leading-snug line-clamp-2 mb-2">{n.intention_text}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {n.distance} · {n.location}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}