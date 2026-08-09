import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useExperienceParticipants } from '@/lib/real-pals';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { toast } from '@/components/ui/use-toast';

export default function BecomePalsSheet({ open, onOpenChange, onBecomePals, experience }) {
  const { t } = useLocalization();
  const { user } = useAuth();
  const { participants, loading } = useExperienceParticipants(experience?.id);
  const [processed, setProcessed] = useState({});
  const [showSent, setShowSent] = useState(false);

  useEffect(() => {
    if (open) {
      setProcessed({});
      setShowSent(false);
    }
  }, [open, experience]);

  if (!open) return null;

  const visible = participants.filter((p) => !processed[p.id]);
  const allDone = participants.length > 0 && visible.length === 0;

  const handleBecomePals = async (p) => {
    if (processed[p.id]) return;
    setProcessed((prev) => ({ ...prev, [p.id]: 'sending' }));
    try {
      const resp = await base44.functions.invoke('authorizationGate', {
        action: 'requestConnection',
        receiverId: p.userId || p.user_id || p.created_by_id || '',
        receiverName: p.name,
        experienceId: experience?.id || 0,
        experienceTitle: experience?.title || '',
        mutualInterests: p.mutualInterests || [],
      });
      const res = resp?.data || resp;
      if (!res?.ok) {
        setProcessed((prev) => { const n = { ...prev }; delete n[p.id]; return n; });
        toast(res?.message || 'Could not send connection request.');
        return;
      }
      setProcessed((prev) => ({ ...prev, [p.id]: 'sent' }));
      setShowSent(true);
      setTimeout(() => setShowSent(false), 2000);
    } catch {
      setProcessed((prev) => { const n = { ...prev }; delete n[p.id]; return n; });
      toast('Could not send connection request.');
    }
  };

  const handleSkip = (p) => setProcessed((prev) => ({ ...prev, [p.id]: 'skipped' }));

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold">{t('experiences.pals.title')}</h2>
        <button onClick={() => onOpenChange(false)} type="button" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-lg font-semibold">{t('experiences.pals.question')}</p>
        <p className="text-sm text-muted-foreground mt-1">From {experience?.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 && !allDone ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t('experiences.pals.all_done')}</p>
          </div>
        ) : (
          <>
            {visible.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={p.avatar} alt={p.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">{p.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{p.sharedExperience || experience?.title}</p>
                  {p.mutualInterests?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.mutualInterests.map((i) => (
                        <span key={i} className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{i}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <Button size="sm" className="h-8 text-xs" onClick={() => handleBecomePals(p)}>{t('experiences.pals.become_pals')}</Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => handleSkip(p)}>{t('experiences.pals.skip')}</Button>
                </div>
              </div>
            ))}
            {allDone && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3 text-2xl">✓</div>
                <p className="font-semibold mb-1">{t('experiences.pals.all_done')}</p>
                <p className="text-sm text-muted-foreground">{t('experiences.pals.requests_sent')}</p>
              </div>
            )}
          </>
        )}
      </div>

      {showSent && (
        <div className="px-4 py-2.5 bg-success/10 text-center">
          <p className="text-sm font-medium text-success">{t('experiences.pals.request_sent')}</p>
        </div>
      )}

      <div className="px-4 py-3 border-t border-border">
        <Button className="w-full" onClick={onBecomePals} disabled={visible.length > 0}>
          {visible.length > 0 ? `${visible.length} remaining` : 'Done'}
        </Button>
      </div>
    </div>
  );
}