import React, { useState } from 'react';
import { Star, MessageSquare, Camera, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { computeNmoodStatus } from '@/lib/nmood-lifecycle';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useToast } from '@/components/ui/use-toast';

export default function NmoodCompletionCard({ post }) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [attended, setAttended] = useState(null);

  const status = computeNmoodStatus(post);
  if (status !== 'completed') return null;

  if (attended === false) return null;

  if (attended === true) {
    return (
      <div className="rounded-xl border border-success/20 bg-success/5 p-4">
        <p className="text-sm font-semibold mb-3 text-success">{t('nmoods.completion.unlocked')}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm"><Star className="w-4 h-4" /> {t('nmoods.completion.rate')}</Button>
          <Button size="sm" variant="outline"><MessageSquare className="w-4 h-4" /> {t('nmoods.completion.review')}</Button>
          <Button size="sm" variant="outline"><Camera className="w-4 h-4" /> {t('nmoods.completion.photos')}</Button>
          <Button size="sm" variant="outline"><UserPlus className="w-4 h-4" /> {t('nmoods.completion.stay_connected')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold mb-3">{t('nmoods.completion.did_you_attend')}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => { setAttended(true); toast({ description: t('nmoods.completion.thanks') }); }}
        >
          {t('nmoods.completion.yes')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => { setAttended(false); toast({ description: t('nmoods.completion.maybe') }); }}
        >
          {t('nmoods.completion.no')}
        </Button>
      </div>
    </div>
  );
}