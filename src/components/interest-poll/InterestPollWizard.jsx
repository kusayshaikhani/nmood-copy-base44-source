import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, ArrowLeft, Send, Users, Circle as CircleIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { usePalsForPoll } from '@/lib/real-pals';
import { useMergedCircles } from '@/lib/circle-store';
import PalSelectionList from '@/components/invite/PalSelectionList';
import SelectedPalChips from '@/components/invite/SelectedPalChips';
import { useLocalization } from '@/lib/i18n/useLocalization';

const examples = [
  { icon: '☕', text: 'Coffee tomorrow evening' },
  { icon: '🍣', text: 'Sushi this Friday' },
  { icon: '🥾', text: 'Hiking this weekend' },
  { icon: '🎬', text: 'Cinema tonight' },
  { icon: '🎾', text: 'Padel after work' },
];

const timeOptions = [
  { id: 'morning', label: 'Morning', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { id: 'evening', label: 'Evening', icon: '🌆' },
  { id: 'weekend', label: 'Weekend', icon: '📅' },
];

const areaOptions = ['Dubai Marina', 'Downtown', 'JVC', 'Business Bay', 'Current Area'];

export default function InterestPollWizard({ open, onOpenChange }) {
  const { t } = useLocalization();
  const [step, setStep] = useState(1);
  const [question, setQuestion] = useState('');
  const [icon, setIcon] = useState('💡');
  const [timePref, setTimePref] = useState('');
  const [area, setArea] = useState('');
  const [recipientType, setRecipientType] = useState('pals');
  const [selectedPalIds, setSelectedPalIds] = useState(new Set());
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [search, setSearch] = useState('');
  const [sent, setSent] = useState(false);
  const { user } = useAuth();

  const { pals, recentlyMetPals, loading: palsLoading } = usePalsForPoll();
  const mergedCircles = useMergedCircles();
  const selectedPals = pals.filter((p) => selectedPalIds.has(p.id));

  const togglePal = (palId) => {
    setSelectedPalIds((prev) => {
      const next = new Set(prev);
      if (next.has(palId)) next.delete(palId);
      else next.add(palId);
      return next;
    });
  };

  const reset = () => {
    setStep(1); setQuestion(''); setIcon('💡'); setTimePref(''); setArea('');
    setRecipientType('pals'); setSelectedPalIds(new Set()); setSelectedCircle(null);
    setSearch(''); setSent(false);
  };

  const handleExample = (ex) => {
    setIcon(ex.icon);
    setQuestion(ex.text);
  };

  const canProceed = step === 1 ? question.trim().length > 0
    : step === 2 ? !!timePref
    : step === 3 ? !!area
    : step === 4 ? (recipientType === 'pals' ? selectedPalIds.size > 0 : !!selectedCircle)
    : true;

  const handleSend = async () => {
    const recipientNames = recipientType === 'pals'
      ? selectedPals.map((p) => p.name)
      : (selectedCircle ? [`${selectedCircle.members} members`] : []);
    const recipientAvatars = recipientType === 'pals'
      ? selectedPals.map((p) => p.avatar)
      : [];

    try {
      await base44.entities.InterestPoll.create({
        question: question.trim(),
        icon,
        time_preference: timePref,
        area,
        recipient_type: recipientType,
        circle_name: recipientType === 'circle' ? selectedCircle?.name : null,
        recipient_names: recipientNames,
        recipient_avatars: recipientAvatars,
        status: 'active',
        interested_count: 0,
        maybe_count: 0,
        declined_count: 0,
      });
    } catch {}
    setSent(true);
    setTimeout(() => { reset(); onOpenChange(false); }, 1500);
  };

  const titles = ['', 'What are you thinking about?', 'When?', 'Where?', 'Who?', 'Review'];
  const title = sent ? '' : titles[step];

  return (
    <BottomSheet open={open} onOpenChange={(o) => { if (!o) setTimeout(reset, 300); onOpenChange(o); }} title={title}>
      <div className="pb-2">
        {sent ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">{icon}</div>
            <p className="font-semibold text-base">{t('interest_poll.wizard.sent')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('interest_poll.wizard.sent_desc')}</p>
          </div>
        ) : step === 1 ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{icon}</span>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('interest_poll.wizard.thinking_placeholder')}
                className="flex-1 h-10 px-3 text-sm rounded-xl bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default"
                autoFocus
              />
            </div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">{t('interest_poll.wizard.suggestions')}</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button key={ex.text} onClick={() => handleExample(ex)} type="button"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border transition-default ${
                    question === ex.text ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/50'
                  }`}>
                  <span>{ex.icon}</span> {ex.text}
                </button>
              ))}
            </div>
            <Button className="w-full mt-4" disabled={!canProceed} onClick={() => setStep(2)}>{t('connections.invite_exp.continue')}</Button>
          </>
        ) : step === 2 ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {timeOptions.map((opt) => (
                <button key={opt.id} onClick={() => setTimePref(opt.id)} type="button"
                  className={`flex items-center gap-2 p-4 rounded-2xl border transition-default ${
                    timePref === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}>
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mb-3">{t('interest_poll.wizard.no_date_required')}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /> {t('hosting.create.back')}</Button>
              <Button className="flex-1" disabled={!canProceed} onClick={() => setStep(3)}>{t('connections.invite_exp.continue')}</Button>
            </div>
          </>
        ) : step === 3 ? (
          <>
            <div className="space-y-2 mb-4">
              {areaOptions.map((a) => (
                <button key={a} onClick={() => setArea(a)} type="button"
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-default ${
                    area === a ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}>
                  <span className="text-sm font-medium">{a}</span>
                  {area === a && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4" /> {t('hosting.create.back')}</Button>
              <Button className="flex-1" disabled={!canProceed} onClick={() => setStep(4)}>{t('connections.invite_exp.continue')}</Button>
            </div>
          </>
        ) : step === 4 ? (
          <>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setRecipientType('pals')} type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-default ${
                  recipientType === 'pals' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'
                }`}>
                <Users className="w-4 h-4" /> {t('experiences.chat.pals')}
              </button>
              <button onClick={() => setRecipientType('circle')} type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-default ${
                  recipientType === 'circle' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'
                }`}>
                <CircleIcon className="w-4 h-4" /> {t('calendar.filter.circle')}
              </button>
            </div>

            {recipientType === 'pals' ? (
              <>
                {selectedPals.length > 0 && (
                  <div className="mb-3"><SelectedPalChips pals={selectedPals} onRemove={togglePal} /></div>
                )}
                <div className="relative mb-3">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('circles.invite.search_placeholder')}
                    className="w-full h-10 ps-10 pe-4 text-sm rounded-xl bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default" />
                </div>
                {palsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  </div>
                ) : pals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{t('interest_poll.wizard.no_pals')}</p>
                ) : (
                  <div className="max-h-[30vh] overflow-y-auto no-scrollbar">
                    <PalSelectionList search={search} selectedIds={selectedPalIds} onTogglePal={togglePal}
                      suggestions={[]} favoritePals={[]} allPals={pals} recentlyMet={recentlyMetPals} />
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2 max-h-[35vh] overflow-y-auto no-scrollbar">
                {mergedCircles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{t('interest_poll.wizard.no_pals') || 'No circles available yet.'}</p>
                ) : mergedCircles.map((c) => (
                  <button key={c.id} onClick={() => setSelectedCircle({ id: c.id, name: c.name, members: c.member_count || 0 })} type="button"
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-default text-start ${
                      selectedCircle?.name === c.name ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}>
                    {c.cover_photo && <img src={c.cover_photo} alt={c.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.member_count || 0} members</p>
                    </div>
                    {selectedCircle?.name === c.name && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4" /> {t('hosting.create.back')}</Button>
              <Button className="flex-1" disabled={!canProceed} onClick={() => setStep(5)}>{t('connections.invite_exp.continue')}</Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <span className="text-2xl">{icon}</span>
                <p className="text-sm font-medium">{question}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2.5 rounded-xl bg-muted/50"><p className="text-[10px] text-muted-foreground">{t('search.filter.when')}</p><p className="font-medium capitalize">{timePref}</p></div>
                <div className="p-2.5 rounded-xl bg-muted/50"><p className="text-[10px] text-muted-foreground">{t('interest_poll.wizard.where')}</p><p className="font-medium">{area}</p></div>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/50">
                <p className="text-[10px] text-muted-foreground mb-1">{t('interest_poll.wizard.who')}</p>
                {recipientType === 'pals' ? (
                  <p className="text-sm font-medium">{selectedPals.length} pal{selectedPals.length > 1 ? 's' : ''}</p>
                ) : (
                  <p className="text-sm font-medium">{selectedCircle?.name} ({selectedCircle?.members} members)</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(4)}><ArrowLeft className="w-4 h-4" /> {t('hosting.create.back')}</Button>
              <Button className="flex-1 gap-2" onClick={handleSend}><Send className="w-4 h-4" />{t('interest_poll.send')}</Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}