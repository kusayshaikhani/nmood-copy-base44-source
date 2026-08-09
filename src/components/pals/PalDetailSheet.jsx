import React, { useState } from 'react';
import { MessageCircle, Mail, Eye, MapPin, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import PalTimeline from './PalTimeline';
import PalCardMenu from './PalCardMenu';
import ReportSheet from '@/components/safety/ReportSheet';
import BlockConfirmSheet from '@/components/safety/BlockConfirmSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PalDetailSheet({ pal, open, onOpenChange, onMessage, onInvite, onViewProfile }) {
  const { t } = useLocalization();
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  if (!pal) return null;
  return (
    <>
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col items-center text-center mb-4">
        <Avatar className="w-20 h-20 mb-2">
          <AvatarImage src={pal.avatar} alt={pal.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">{pal.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="font-semibold text-lg">{pal.name}</h2>
        <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {pal.city}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2.5 rounded-xl bg-muted/50">
          <p className="text-lg font-bold">{pal.mutualExperiences}</p>
          <p className="text-[10px] text-muted-foreground">{t('connections.detail.mutual_exps')}</p>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-muted/50">
          <p className="text-lg font-bold">{pal.sharedInterests?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">{t('connections.detail.shared_interests')}</p>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-muted/50">
          <p className="text-xs font-bold truncate">{pal.lastExperienceDate}</p>
          <p className="text-[10px] text-muted-foreground">{t('connections.detail.last_met')}</p>
        </div>
      </div>

      {pal.sharedInterests?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1.5">{t('connections.detail.mutual_interests')}</p>
          <div className="flex flex-wrap gap-1.5">
            {pal.sharedInterests.map(i => (
              <span key={i} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">{i}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1.5">{t('connections.detail.last_experience')}</p>
        <p className="text-sm font-medium">{pal.lastExperienceTogether}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">{t('connections.detail.timeline')}</p>
        <PalTimeline pal={pal} />
      </div>

      <Button variant="outline" className="w-full gap-2 mb-2" onClick={() => { onOpenChange(false); window.location.href = `/pal/${pal.id}/timeline`; }}>
        <Clock className="w-4 h-4" /> {t('connections.detail.view_timeline')}
      </Button>
      <div className="flex gap-2 mb-2">
        <Button className="flex-1 gap-2" onClick={onMessage}>
          <MessageCircle className="w-4 h-4" /> {t('connections.pal.message')}
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={onInvite}>
          <Mail className="w-4 h-4" /> {t('connections.pal.invite')}
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onViewProfile}>
          <Eye className="w-3.5 h-3.5" /> {t('connections.pal.view')}
        </Button>
        <PalCardMenu palName={pal.name} onBlock={() => setShowBlock(true)} onReport={() => setShowReport(true)} />
      </div>
    </BottomSheet>

      <ReportSheet open={showReport} onOpenChange={setShowReport} target={{ type: 'member', id: pal.id, name: pal.name, image: pal.avatar }} />
      <BlockConfirmSheet open={showBlock} onOpenChange={setShowBlock} member={{ id: pal.id, name: pal.name, avatar: pal.avatar }} />
    </>
  );
}