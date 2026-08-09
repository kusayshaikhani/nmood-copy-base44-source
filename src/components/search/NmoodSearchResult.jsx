import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NmoodSearchResult({ result }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  return (
    <button
      type="button"
      onClick={() => navigate(`/nmood/${result.id}`)}
      className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/40 transition-all text-left"
    >
      <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{result.category_icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground/80">{t('nmoods.im_nmood_for')}</p>
        <p className="text-sm font-semibold leading-snug line-clamp-2">{result.intention_text}</p>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {result.distance}</span>
          <span>·</span>
          <span className="truncate">{result.location}</span>
          <span>·</span>
          <span className="truncate">{result.member_first_name}</span>
        </div>
      </div>
    </button>
  );
}