import React from 'react';
import { MapPin, Lock } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NmoodMiniMap({ post }) {
  const { t } = useLocalization();
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2">{t('nmoods.detail.location')}</h2>
      <div className="relative h-44 rounded-xl border border-border overflow-hidden bg-gradient-to-br from-primary/10 via-accent/8 to-primary/5">
        {/* Stylized map grid lines */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Roads */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-border/40 -rotate-6" />
        <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-border/40 rotate-12" />
        {/* Pin */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm font-semibold mt-3">{post.location}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Lock className="w-3 h-3" /> {t('nmoods.detail.approximate')}
          </p>
        </div>
      </div>
    </div>
  );
}