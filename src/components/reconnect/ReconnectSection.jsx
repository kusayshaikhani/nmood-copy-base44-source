import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import ReconnectCard from './ReconnectCard';
import ReconnectQuickActions from './ReconnectQuickActions';
import GreetingSheet from './GreetingSheet';
import InterestPollWizard from '@/components/interest-poll/InterestPollWizard';
import { useReconnectSuggestions } from '@/lib/real-pals';
import { snoozeSuggestion, isReconnectDisabled } from '@/lib/reconnect-data';

export default function ReconnectSection() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { suggestions: allSuggestions, loading } = useReconnectSuggestions();
  const [snoozedIds, setSnoozedIds] = useState(new Set());
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showPollWizard, setShowPollWizard] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  // RC-005A: suggestions come from real PalConnection entities.
  // Apply snooze + disabled filters locally (localStorage-backed).
  const suggestions = isReconnectDisabled()
    ? []
    : allSuggestions.filter((s) => !snoozedIds.has(s.id));

  const handleDismiss = (id) => {
    snoozeSuggestion(id);
    setSnoozedIds((prev) => new Set([...prev, id]));
  };

  const handleInviteAgain = (suggestion) => {
    setActiveSuggestion(suggestion);
    setShowQuickActions(true);
  };

  // RC-005A: "Invite to Experience" navigates to Explore so the user picks a
  // real experience — no fabricated experience is ever shown.
  const handleInviteToExperience = () => {
    setShowQuickActions(false);
    navigate('/explore');
  };

  const activePal = activeSuggestion ? {
    name: activeSuggestion.palName,
    avatar: activeSuggestion.palAvatar,
    city: activeSuggestion.palCity,
  } : null;

  if (loading || suggestions.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-primary" /> {t('reconnect.section.title')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('reconnect.section.subtitle')}</p>
        </div>
        <button onClick={() => navigate('/pals')} className="text-sm text-primary font-medium" type="button">{t('common.see_all')}</button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {suggestions.slice(0, 3).map(s => (
          <div key={s.id} className="flex-shrink-0 w-72">
            <ReconnectCard suggestion={s} onInviteAgain={handleInviteAgain} onDismiss={handleDismiss} />
          </div>
        ))}
      </div>

      <ReconnectQuickActions
        open={showQuickActions}
        onOpenChange={setShowQuickActions}
        pal={activePal}
        onInviteToExperience={handleInviteToExperience}
        onSuggestExperience={() => { setShowQuickActions(false); setShowPollWizard(true); }}
        onSendGreeting={() => { setShowQuickActions(false); setShowGreeting(true); }}
      />

      <InterestPollWizard open={showPollWizard} onOpenChange={setShowPollWizard} />
      <GreetingSheet open={showGreeting} onOpenChange={setShowGreeting} pal={activePal} />
    </section>
  );
}