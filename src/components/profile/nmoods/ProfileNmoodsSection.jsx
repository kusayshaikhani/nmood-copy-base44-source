import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { getProfileNmoods } from '@/lib/nmood-recommendations';

const SECTIONS = ['current', 'upcoming', 'completed', 'saved'];

export default function ProfileNmoodsSection() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('current');
  const nmoods = getProfileNmoods(activeTab);

  return (
    <div className="px-6">
      <h2 className="text-sm font-bold mb-3">{t('nmoods.profile.title')}</h2>
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveTab(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {t(`nmoods.profile.tab.${s}`)}
          </button>
        ))}
      </div>
      {nmoods.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t(`nmoods.profile.empty.${activeTab}`)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {nmoods.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => navigate(`/nmood/${n.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-all text-left"
            >
              <span className="text-xl leading-none flex-shrink-0">{n.category_icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-1">{n.intention_text}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {n.distance} · {n.location}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}