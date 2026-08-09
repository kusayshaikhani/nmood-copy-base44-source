import React, { useState } from 'react';
import { Link as LinkIcon, MessageCircle, Send, Mail, MoreHorizontal, Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ShareSheet({ open, onOpenChange, experience }) {
  const { t } = useLocalization();
  const [copied, setCopied] = useState(false);
  const shareUrl = experience ? `${window.location.origin}/experience/${experience.id}` : '';

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: experience?.title,
          text: experience?.description,
          url: shareUrl,
        });
        onOpenChange(false);
      } catch {}
    } else {
      copyLink();
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickOptions = [
    { icon: MessageCircle, label: 'Messages', color: 'bg-success/10 text-success' },
    { icon: Send, label: 'Send', color: 'bg-info/10 text-info' },
    { icon: Mail, label: 'Email', color: 'bg-warning/10 text-warning' },
    { icon: MoreHorizontal, label: 'More', color: 'bg-muted text-muted-foreground' },
  ];

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('experiences.share.title')} description={experience?.title}>
      <div className="space-y-3 pb-4 pt-2">
        {typeof navigator !== 'undefined' && navigator.share && (
          <Button className="w-full h-12 gap-2" onClick={handleNativeShare}>
            <Share2 className="w-4 h-4" /> {t('experiences.share.share_via')}
          </Button>
        )}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
          <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input value={shareUrl} readOnly className="flex-1 bg-transparent text-sm outline-none min-w-0" />
          <Button size="sm" variant={copied ? 'default' : 'outline'} onClick={copyLink} className="gap-1 flex-shrink-0">
            {copied ? <><Check className="w-3 h-3" /> {t('experiences.share.copied')}</> : <><Copy className="w-3 h-3" /> {t('experiences.share.copy')}</>}
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-3 pt-2">
          {quickOptions.map(({ icon: Icon, label, color }) => (
            <button key={label} onClick={handleNativeShare} type="button" className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-default hover:scale-105 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}