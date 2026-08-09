import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, HelpCircle, X, Calendar } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function InterestPollCard({ poll }) {
  const { t } = useLocalization();
  const [response, setResponse] = useState(poll?.my_response || null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  if (!poll) return null;

  const handleRespond = (resp) => {
    setResponse(resp);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={poll.sender_avatar} alt={poll.sender_name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">{poll.sender_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{poll.sender_name}</p>
          <p className="text-xs text-muted-foreground">{t('interest_poll.card.thinking')}</p>
        </div>
      </div>

      <div className="p-4 text-center">
        <div className="text-4xl mb-2">{poll.icon}</div>
        <p className="text-xs text-muted-foreground mb-1">{t('interest_poll.card.your_pal_thinking')}</p>
        <p className="font-semibold text-base">{poll.question}</p>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
          <span className="capitalize">{poll.time_preference}</span>
          <span>·</span>
          <span>{poll.area}</span>
        </div>
      </div>

      {response ? (
        <div className="px-4 pb-4">
          <div className={`p-3 rounded-xl text-center text-sm font-medium ${
            response === 'in' ? 'bg-success/10 text-success' :
            response === 'maybe' ? 'bg-info/10 text-info' :
            'bg-muted text-muted-foreground'
          }`}>
            {response === 'in' ? "✅ You're In!" : response === 'maybe' ? "🤔 Maybe" : "❌ Not This Time"}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setResponse(null)}>{t('invitation.change_response')}</Button>
        </div>
      ) : (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-center text-muted-foreground mb-2">{t('interest_poll.card.interested')}</p>
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" className="h-10 gap-1 text-xs" onClick={() => handleRespond('in')}>
              <Check className="w-4 h-4" /> {t('interest_poll.card.im_in')}
            </Button>
            <Button variant="outline" size="sm" className="h-10 gap-1 text-xs" onClick={() => handleRespond('maybe')}>
              <HelpCircle className="w-4 h-4" /> {t('invitation.maybe')}
            </Button>
            <Button variant="outline" size="sm" className="h-10 gap-1 text-xs text-destructive hover:text-destructive" onClick={() => handleRespond('no')}>
              <X className="w-4 h-4" /> {t('hosting.step_basic.no')}
            </Button>
          </div>
          {!showSuggest ? (
            <button onClick={() => setShowSuggest(true)} type="button" className="w-full text-xs text-muted-foreground hover:text-foreground transition-default flex items-center justify-center gap-1 pt-1">
              <Calendar className="w-3 h-3" /> {t('interest_poll.card.suggest_day')}
            </button>
          ) : (
            <div className="flex gap-2 pt-1">
              <input value={suggestion} onChange={(e) => setSuggestion(e.target.value)} placeholder={t('interest_poll.card.suggest_placeholder')}
                className="flex-1 h-8 px-3 text-xs rounded-lg bg-muted border border-transparent focus:border-border focus:outline-none" />
              <Button size="sm" className="h-8 text-xs" disabled={!suggestion.trim()} onClick={() => { setResponse('suggested'); }}>{t('experiences.share.send')}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}