import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useConnections } from '@/lib/connections-store';
import { useHaptic } from '@/lib/haptics';
import { getBudgetDetailLabel } from '@/lib/budget-utils';
import PalSelectionList from './PalSelectionList';
import SelectedPalChips from './SelectedPalChips';
import InvitationPreview from './InvitationPreview';
import { useLocalization } from '@/lib/i18n/useLocalization';

function palFromConnection(c) {
  return {
    id: c.id,
    user_id: c.pal_user_id,
    name: c.pal_name,
    avatar: c.pal_avatar,
    interests: c.mutual_interests || [],
    mutualExperiences: c.mutual_experiences_count || 0,
    city: c.pal_city || '',
  };
}

export default function InvitePalsSheet({ experience, pals, open, onOpenChange }) {
  const { t } = useLocalization();
  const { user } = useAuth();
  const conn = useConnections(user);
  const haptic = useHaptic();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState(t('connections.invite_exp.note_placeholder'));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const palList = useMemo(() => {
    if (pals && pals.length) return pals;
    return (conn.connections || []).map(palFromConnection);
  }, [pals, conn.connections]);

  useEffect(() => {
    try { setFavorites(JSON.parse(localStorage.getItem('inmood_favorites') || '[]')); } catch { setFavorites([]); }
  }, []);

  const selectedPals = palList.filter((p) => selectedIds.has(p.id));
  const favoritePals = palList.filter((p) => favorites.includes(p.id));

  const suggestions = useMemo(() => {
    const expCategory = (experience?.category || '').toLowerCase();
    return palList
      .map((pal) => {
        let score = 0;
        const reasons = [];
        (pal.interests || []).forEach((i) => {
          if (expCategory && (i.toLowerCase().includes(expCategory) || expCategory.includes(i.toLowerCase()))) {
            score += 3;
            if (reasons.length < 2) reasons.push(t('connections.invite_exp.reason.shared_interest'));
          }
        });
        if ((pal.mutualExperiences || 0) > 0) { score += 2; if (reasons.length < 2) reasons.push(t('connections.invite_exp.reason.shared_experiences', { count: pal.mutualExperiences })); }
        return { ...pal, score, reasons };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [palList, experience, t]);

  const togglePal = (palId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(palId)) next.delete(palId);
      else next.add(palId);
      return next;
    });
  };

  const defaultMsg = t('connections.invite_exp.note_placeholder');
  const reset = () => {
    setStep(1); setSearch(''); setSelectedIds(new Set());
    setMessage(defaultMsg); setSent(false);
  };

  const handleSend = async () => {
    setSending(true);
    const senderName = user?.full_name || 'You';
    const budgetLabel = getBudgetDetailLabel(experience);
    try {
      await base44.entities.Invitation.bulkCreate(
        selectedPals.map((pal) => ({
          experience_id: experience.id,
          experience_title: experience.title,
          experience_image: experience.image,
          experience_date: experience.date,
          experience_time: experience.time,
          experience_venue: experience.venue?.name,
          experience_budget: budgetLabel,
          sender_name: senderName,
          pal_name: pal.name,
          pal_avatar: pal.avatar,
          personal_message: message,
          status: 'pending',
          direction: 'outgoing',
        }))
      );
    } catch { /* ignore — UI still confirms */ }
    setSending(false);
    setSent(true);
    haptic('success');
    setTimeout(() => { reset(); onOpenChange(false); }, 1500);
  };

  const title = sent ? '' : step === 1 ? t('connections.invite_exp.title_step1') : step === 2 ? t('connections.invite_exp.title_step2') : t('connections.invite_exp.title_step3');
  const description = sent ? '' : step === 1 ? t('connections.invite_exp.desc_step1', { title: experience?.title || '' }) : undefined;

  return (
    <BottomSheet open={open} onOpenChange={(o) => { if (!o) setTimeout(reset, 300); onOpenChange(o); }} title={title} description={description}>
      <div className="pb-2">
        {sent ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-success" />
            </div>
            <p className="font-semibold text-base">{t('connections.invite_exp.sent_title')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('connections.invite_exp.sent_desc', { count: selectedPals.length, title: experience?.title || '' })}</p>
          </div>
        ) : palList.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-medium mb-1">{t('connections.invite_exp.no_pals_title')}</p>
            <p className="text-xs text-muted-foreground mb-4">{t('connections.invite_exp.no_pals_desc')}</p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
          </div>
        ) : step === 1 ? (
          <>
            <div className="relative mb-3">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('connections.invite_exp.search_placeholder')}
                className="w-full h-10 ps-10 pe-4 text-sm rounded-xl bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default"
              />
            </div>

            {selectedPals.length > 0 && (
              <div className="mb-3">
                <SelectedPalChips pals={selectedPals} onRemove={togglePal} />
              </div>
            )}

            <div className="max-h-[40vh] overflow-y-auto no-scrollbar">
              <PalSelectionList
                search={search}
                selectedIds={selectedIds}
                onTogglePal={togglePal}
                suggestions={suggestions}
                favoritePals={favoritePals}
                allPals={palList}
                recentlyMet={[]}
              />
            </div>

            <Button className="w-full mt-4 gap-2" disabled={selectedPals.length === 0} onClick={() => setStep(2)}>
              {selectedPals.length > 0 ? t('connections.invite_exp.continue_count', { count: selectedPals.length }) : t('connections.invite_exp.continue')}
            </Button>
          </>
        ) : step === 2 ? (
          <>
            <div className="mb-3">
              <p className="text-sm text-muted-foreground mb-2">{t('connections.invite_exp.note_label')}</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                rows={4}
                placeholder={defaultMsg}
                className="w-full p-3 text-sm rounded-xl bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default resize-none"
              />
              <p className="text-xs text-muted-foreground text-end mt-1">{t('connections.invite_exp.char_count', { count: message.length })}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4" /> {t('connections.invite_exp.back')}
              </Button>
              <Button className="flex-1 gap-2" onClick={() => setStep(3)}>
                {t('connections.invite_exp.continue')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="max-h-[40vh] overflow-y-auto no-scrollbar">
              <InvitationPreview experience={experience} selectedPals={selectedPals} message={message} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4" /> {t('connections.invite_exp.back')}
              </Button>
              <Button className="flex-1 gap-2" disabled={sending} onClick={handleSend}>
                {sending ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                {t('connections.invite_exp.send')}
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}