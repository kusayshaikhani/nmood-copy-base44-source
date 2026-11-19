import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Search, Check, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { useAuth } from '@/lib/AuthContext';
import { sendExperienceInvitations } from '@/api/supabaseClient';
import { useConnections } from '@/lib/connections-store';
import { useHaptic } from '@/lib/haptics';
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

export default function InvitePalsSheet({ experience, pals, initialRecipient, open, onOpenChange }) {
  const { t } = useLocalization();
  const { user } = useAuth();
  const conn = useConnections(user);
  const haptic = useHaptic();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState(t('connections.invite_exp.note_placeholder'));
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const palList = useMemo(() => {
    const available = pals && pals.length ? pals : (conn.connections || []).map(palFromConnection);
    if (!initialRecipient?.id || available.some((pal) => (pal.user_id || pal.id) === initialRecipient.id)) return available;
    // Mutual matches may be invited before the local connections list refreshes.
    return [{ id: initialRecipient.id, user_id: initialRecipient.id, name: initialRecipient.name || 'Your match', avatar: initialRecipient.avatar || '' }, ...available];
  }, [pals, conn.connections, initialRecipient]);

  useEffect(() => {
    try { setFavorites(JSON.parse(localStorage.getItem('inmood_favorites') || '[]')); } catch { setFavorites([]); }
  }, []);

  useEffect(() => {
    if (open && initialRecipient?.id) setSelectedIds(new Set([initialRecipient.id]));
  }, [open, initialRecipient?.id]);

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
    if (inFlight.current || selectedPals.length === 0) return;
    inFlight.current = true; setSendError('');
    setSending(true);
    try {
      const recipientIds = selectedPals.map((pal) => pal.user_id || pal.id).filter(Boolean);
      const rows = await sendExperienceInvitations(experience?.id, recipientIds, message.trim());
      if (!Array.isArray(rows) || rows.length !== new Set(recipientIds).size) throw new Error('Not all invitations were sent.');
      setSent(true);
      haptic('success');

    } catch {
      setSendError('Invitation could not be sent. Please try again when you’re ready.');
    } finally {
      inFlight.current = false; setSending(false);
    }
  };

  const title = sent ? '' : step === 1 ? t('connections.invite_exp.title_step1') : step === 2 ? t('connections.invite_exp.title_step2') : t('connections.invite_exp.title_step3');
  const description = sent ? '' : step === 1 ? t('connections.invite_exp.desc_step1', { title: experience?.title || '' }) : undefined;

  return (
    <BottomSheet open={open} onOpenChange={(o) => { if (!o) setTimeout(reset, 300); onOpenChange(o); }} title={title} description={description}>
      <div className="pb-2">
        {sendError && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{sendError}</p>}
        {sent ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-success" />
            </div>
            <Button variant="outline" className="mb-3" onClick={() => onOpenChange(false)}>Done</Button><p className="font-semibold text-base">{t('connections.invite_exp.sent_title')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('connections.invite_exp.sent_desc', { count: selectedPals.length, title: experience?.title || '' })}</p>
          </div>
        ) : conn.loading && !initialRecipient?.id ? <p role="status" className="py-6 text-sm">Loading connected Pals…</p> : conn.error && !initialRecipient?.id ? <p role="alert" className="py-6 text-sm">Connected Pals couldn’t load. Close this sheet and reopen it when you’re ready.</p> : palList.length === 0 ? (
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
