import React from 'react';
import { Bell, ExternalLink } from 'lucide-react';
import { CHANNEL_LABEL } from '@/lib/communication-metrics';
import SmartImage from '@/components/shared/SmartImage';
import { useLocalization } from '@/lib/i18n/useLocalization';

function stripHtml(h) { return (h || '').replace(/<[^>]*>/g, ''); }

export default function MessagePreview({ campaign }) {
  const { t } = useLocalization();
  const type = campaign.type || 'in_app';
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground flex items-center justify-between">
        <span>{t('mission.preview')}</span><span className="capitalize">{CHANNEL_LABEL[type]}</span>
      </div>
      <div className="p-4">
        {type === 'email' ? (
          <div className="rounded-lg border p-4 bg-background">
            <p className="text-xs text-muted-foreground">{t('mission.from_nmood')}</p>
            <p className="text-sm font-semibold mt-1">{campaign.subject || campaign.title || '(Subject)'}</p>
            <div className="text-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: campaign.body || '<p class="text-muted-foreground">' + t('mission.message_body') + '</p>' }} />
            {campaign.image_url && <div className="mt-2 rounded-lg overflow-hidden max-w-[240px]"><SmartImage src={campaign.image_url} alt={t('mission.campaign')} blur={false} /></div>}
            {campaign.cta_label && <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary">{campaign.cta_label} <ExternalLink className="w-3 h-3" /></span>}
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0"><Bell className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">{campaign.title || campaign.name || 'Notification'}</p><span className="text-[10px] text-muted-foreground">{t('mission.now')}</span></div>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-3">{campaign.body ? stripHtml(campaign.body) : 'Message body…'}</p>
              {campaign.image_url && <div className="mt-2 rounded-lg overflow-hidden max-w-[200px]"><SmartImage src={campaign.image_url} alt={t('mission.campaign')} blur={false} /></div>}
              {campaign.cta_label && <span className="mt-2 text-xs font-medium text-primary inline-flex items-center gap-1">{campaign.cta_label} <ExternalLink className="w-3 h-3" /></span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}