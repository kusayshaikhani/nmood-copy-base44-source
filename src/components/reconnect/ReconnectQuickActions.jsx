import React, { useState } from 'react';
import { Mail, Sparkles, Crown, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ReconnectQuickActions({ open, onOpenChange, pal, onInviteToExperience, onSuggestExperience, onSendGreeting }) {
  const { t } = useLocalization();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const firstName = pal?.name?.split(' ')[0] || 'Pal';

  const actions = [
    { icon: Mail, label: 'Invite to Experience', color: 'text-primary', bg: 'bg-primary/10', onClick: () => { onOpenChange(false); onInviteToExperience?.(); } },
    { icon: Sparkles, label: 'Suggest an Experience', color: 'text-accent-foreground', bg: 'bg-accent/20', onClick: () => { onOpenChange(false); onSuggestExperience?.(); } },
    { icon: Crown, label: 'Host Together', color: 'text-warning', bg: 'bg-warning/10', onClick: () => setShowComingSoon(true) },
    { icon: Heart, label: 'Send a Greeting', color: 'text-destructive', bg: 'bg-destructive/10', onClick: () => { onOpenChange(false); onSendGreeting?.(); } },
  ];

  return (
    <BottomSheet open={open} onOpenChange={(o) => { if (!o) setShowComingSoon(false); onOpenChange(o); }} title={showComingSoon ? '' : `Reconnect with ${firstName}`}>
      {showComingSoon ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">👑</div>
          <p className="font-semibold text-sm">{t('trust.action.coming_soon')}</p>
          <p className="text-xs text-muted-foreground mt-1">Host Together is coming in a future update.</p>
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setShowComingSoon(false)}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </div>
      ) : (
        <div className="space-y-2 pb-2">
          <p className="text-xs text-muted-foreground mb-2">How would you like to reconnect?</p>
          {actions.map(action => (
            <button key={action.label} onClick={action.onClick} type="button"
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-default text-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${action.bg}`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}