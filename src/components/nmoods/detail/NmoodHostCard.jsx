import React from 'react';
import { Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NmoodHostCard({ post }) {
  const { t } = useLocalization();
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2">{t('nmoods.detail.host')}</h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <img src={post.member_avatar} alt={post.member_first_name} loading="lazy" className="w-11 h-11 rounded-full object-cover ring-1 ring-border/50 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold truncate">{post.member_first_name}</span>
              <span className="text-xs text-muted-foreground">{post.member_age}</span>
              {post.verified && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 shrink-0">
                  <Check className="w-2.5 h-2.5 text-primary" strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {t('nmoods.away', { distance: post.distance })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(post.member_languages || []).map((lang) => (
            <span key={lang} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {lang}
            </span>
          ))}
          {(post.member_interests || []).slice(0, 3).map((interest) => (
            <span key={interest} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {interest}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">{t('nmoods.detail.view_profile')}</Button>
          <Button variant="ghost" size="sm" className="flex-1">{t('nmoods.detail.message')}</Button>
        </div>
      </div>
    </div>
  );
}