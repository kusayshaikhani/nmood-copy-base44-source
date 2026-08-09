import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown, Loader2 } from 'lucide-react';
import { useActivePolls, getPendingCount, hasEnoughInterest, timePreferenceLabels } from '@/lib/interest-poll-live';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function InterestPollDashboard() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { polls, loading } = useActivePolls();

  const handleConvert = (poll) => {
    localStorage.setItem('inmood_poll_convert', JSON.stringify({
      question: poll.question,
      time_preference: poll.time_preference,
      area: poll.area,
    }));
    navigate('/host/create');
  };

  if (loading) {
    return (
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3 px-1">{t('interest_poll.active_polls')}</h2>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      </section>
    );
  }

  if (polls.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold mb-3 px-1">{t('interest_poll.active_polls')}</h2>
      <div className="space-y-3">
        {polls.map((poll) => {
          const pending = getPendingCount(poll);
          const enough = hasEnoughInterest(poll);
          const total = (poll.recipient_names || []).length;

          return (
            <div key={poll.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl flex-shrink-0">{poll.icon || '💡'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{poll.question}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {timePreferenceLabels[poll.time_preference] || poll.time_preference} · {poll.area}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center p-2 rounded-xl bg-success/10">
                  <p className="text-lg font-bold text-success">{poll.interested_count}</p>
                  <p className="text-[9px] text-muted-foreground">{t('interest_poll.dashboard.in')}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-info/10">
                  <p className="text-lg font-bold text-info">{poll.maybe_count}</p>
                  <p className="text-[9px] text-muted-foreground">{t('invitation.maybe')}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-muted">
                  <p className="text-lg font-bold text-muted-foreground">{poll.declined_count}</p>
                  <p className="text-[9px] text-muted-foreground">{t('hosting.step_basic.no')}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-warning/10">
                  <p className="text-lg font-bold text-warning">{pending}</p>
                  <p className="text-[9px] text-muted-foreground">{t('invitation.pending')}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {poll.recipient_avatars?.slice(0, 5).map((avatar, i) => (
                  <Avatar key={i} className="w-6 h-6 border-2 border-card rounded-full overflow-hidden">
                    <img src={avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </Avatar>
                ))}
                {total > 5 && (
                  <span className="text-xs text-muted-foreground ms-1">+{total - 5}</span>
                )}
              </div>

              {enough ? (
                <div className="rounded-xl bg-gradient-to-r from-success/10 to-primary/5 border border-success/20 p-3 mb-2">
                  <p className="text-sm font-medium text-success flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> {t('interest_poll.dashboard.interested')}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center mb-2">
                  {pending > 0 ? `Waiting for ${pending} response${pending > 1 ? 's' : ''}...` : 'Not enough interest yet.'}
                </p>
              )}

              <Button
                className="w-full gap-2"
                size="sm"
                disabled={!enough}
                onClick={() => handleConvert(poll)}
              >
                <Crown className="w-4 h-4" /> {t('interest_poll.dashboard.host_this')}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}