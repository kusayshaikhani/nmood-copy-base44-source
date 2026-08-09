import React from 'react';
import { Heart, Globe, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';

export default function AboutSection({ member }) {
  const { t } = useLocalization();
  const memberInterests = member?.interests || [];
  const languages = member?.languages || [];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('profile.about.title')}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Heart className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('profile.about.interests')}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {memberInterests.length > 0 ? (
              memberInterests.map((interest) => (
                <span key={interest} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {categoryLabel(t, interest)}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">{t('profile.about.interests_empty')}</span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('profile.about.languages')}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languages.length > 0 ? (
              languages.map((lang) => (
                <span key={lang} className="text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-full">
                  {lang}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">{t('profile.about.languages_empty')}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}