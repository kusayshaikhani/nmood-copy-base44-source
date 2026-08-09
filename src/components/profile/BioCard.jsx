import React from 'react';
import { User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

// BUG-009: Bio displays directly below the Profile Status card. It updates
// immediately after saving (Profile.jsx calls refreshMember on save) and
// persists on the Member entity across refresh / logout / device restart.
export default function BioCard({ member }) {
  const { t } = useLocalization();
  const bio = member?.bio || '';
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('profile.bio.title')}</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {bio || t('profile.bio.empty')}
      </p>
    </Card>
  );
}