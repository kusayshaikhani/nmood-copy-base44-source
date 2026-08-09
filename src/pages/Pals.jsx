import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Sparkles, Check, X, Star, Clock, Activity, ArrowDownAZ, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PalCard from '@/components/pals/PalCard';
import RequestCard from '@/components/pals/RequestCard';
import EmptyPals from '@/components/pals/EmptyPals';
import PalDetailSheet from '@/components/pals/PalDetailSheet';
import InvitePalSheet from '@/components/pals/InvitePalSheet';
import PalsAcceptedSheet from '@/components/pals/PalsAcceptedSheet';
import MultiInviteBar from '@/components/pals/MultiInviteBar';
import InterestPollWizard from '@/components/interest-poll/InterestPollWizard';
import { useAuth } from '@/lib/AuthContext';
import { BRAND } from '@/lib/system-config';
import {
  useConnections, mapIncoming, mapOutgoing, mapConnection,
  acceptRequest, declineRequest, cancelRequest, removeConnection,
} from '@/lib/connections-store';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { useSafety } from '@/lib/safety-store';
import { useHaptic } from '@/lib/haptics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const SENT_TAB_KEYS = ['pending', 'accepted', 'declined', 'cancelled'];

function IncomingRequestWrapper({ index, request, onAccept, onDecline }) {
  const { t } = useLocalization();
  const { can, showUpgrade, isPremium } = useMembershipAccess();
  const perm = can(FEATURES.VIEW_INCOMING_REQUESTS, { index });
  if (perm) {
    return <RequestCard request={request} onAccept={onAccept} onDecline={onDecline} />;
  }
  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="filter blur-sm select-none pointer-events-none opacity-60">
        <RequestCard request={request} />
      </div>
      <button
        type="button"
        onClick={() => {
          trackMembershipEvent(MEMBERSHIP_EVENTS.LIMIT_REACHED, { feature: 'view_incoming_requests' });
          showUpgrade('view_incoming_requests');
        }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/50 backdrop-blur-sm"
      >
        <Lock className="w-5 h-5 text-primary" />
        <span className="text-xs font-medium text-primary">{t('connections.premium.unlock_view')}</span>
      </button>
    </div>
  );
}

export default function Pals() {
  const { t } = useLocalization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isPremium, showUpgrade } = useMembershipAccess();
  const conn = useConnections(user);
  const { isBlocked } = useSafety();
  const haptic = useHaptic();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [favorites, setFavorites] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedPal, setSelectedPal] = useState(null);
  const [invitePals, setInvitePals] = useState(null);
  const [acceptedPal, setAcceptedPal] = useState(null);
  const [showPollWizard, setShowPollWizard] = useState(false);
  const [sentTab, setSentTab] = useState('pending');

  useEffect(() => {
    try { setFavorites(JSON.parse(localStorage.getItem('inmood_favorites') || '[]')); } catch { setFavorites([]); }
  }, []);

  const incoming = useMemo(() => (conn.incoming || []).filter((r) => !isBlocked(r.sender_user_id)).map(mapIncoming), [conn.incoming, isBlocked]);
  const outgoing = useMemo(() => (conn.outgoing || []).filter((r) => !isBlocked(r.receiver_user_id)).map(mapOutgoing), [conn.outgoing, isBlocked]);
  const connections = useMemo(() => (conn.connections || []).filter((c) => !isBlocked(c.pal_user_id)).map(mapConnection), [conn.connections, isBlocked]);

  const sentByStatus = useMemo(() => ({
    pending: outgoing.filter((r) => r.status === 'pending'),
    accepted: outgoing.filter((r) => r.status === 'accepted'),
    declined: outgoing.filter((r) => r.status === 'declined'),
    cancelled: outgoing.filter((r) => r.status === 'cancelled'),
  }), [outgoing]);

  const sortedPals = useMemo(() => {
    let list = [...connections];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.sharedInterests || []).some((i) => i.toLowerCase().includes(q))
      );
    }
    if (sort === 'recent') {
      list.sort((a, b) => new Date(b.lastActivityAt || b.connectedDate || 0) - new Date(a.lastActivityAt || a.connectedDate || 0));
    } else if (sort === 'activity') {
      list.sort((a, b) => new Date(b.updatedDate || 0) - new Date(a.updatedDate || 0));
    } else if (sort === 'az') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    const favs = list.filter((p) => favorites.includes(p.id));
    const rest = list.filter((p) => !favorites.includes(p.id));
    return [...favs, ...rest];
  }, [connections, search, sort, favorites]);

  const toggleFavorite = (palId) => {
    setFavorites((prev) => {
      const isFav = prev.includes(palId);
      const updated = isFav ? prev.filter((id) => id !== palId) : (prev.length >= 20 ? prev : [...prev, palId]);
      localStorage.setItem('inmood_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSelect = (palId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(palId)) next.delete(palId);
      else next.add(palId);
      return next;
    });
  };

  const handleMultiInvite = () => {
    const selected = connections.filter((p) => selectedIds.has(p.id));
    setInvitePals(selected);
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const cancelSelect = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const handleAccept = async (request) => {
    haptic('success');
    await acceptRequest(request.raw, user);
    setAcceptedPal(request);
  };
  const handleDecline = async (request) => { haptic('warning'); await declineRequest(request.raw); };
  const handleCancel = async (request) => { haptic('warning'); await cancelRequest(request.raw); };
  const handleRemove = async (pal) => { haptic('warning'); await removeConnection(pal.raw); };

  const openInviteFromDetail = () => {
    const pal = selectedPal;
    setSelectedPal(null);
    setInvitePals(pal ? [pal] : null);
  };

  const palCardProps = (pal) => ({
    pal,
    isFavorite: favorites.includes(pal.id),
    onToggleFavorite: toggleFavorite,
    selectMode,
    isSelected: selectedIds.has(pal.id),
    onToggleSelect: toggleSelect,
    onView: () => setSelectedPal(pal),
    onInvite: () => setInvitePals([pal]),
    onMessage: () => navigate('/messages/' + pal.pal_user_id),
    onRemove: handleRemove,
  });

  const showSentSection = outgoing.length > 0;

  const SORTS = [
    { key: 'recent', label: t('connections.sort.recent'), icon: Clock },
    { key: 'activity', label: t('connections.sort.activity'), icon: Activity },
    { key: 'az', label: t('connections.sort.az'), icon: ArrowDownAZ },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto w-full">
        {/* Gradient hero — title, actions, search */}
        <div className="relative bg-nmood-gradient px-4 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-8">
          <div className="absolute inset-0 overflow-hidden">
            <div className="nmood-glow -top-16 -right-12 w-48 h-48 bg-white/20" />
            <div className="nmood-glow top-12 -left-16 w-44 h-44 bg-indigo-300/30" />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{t('connections.title')}</h1>
                <p className="text-sm text-white/80">{t('connections.subtitle', { slogan: BRAND.slogan_inline })}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" className="gap-2 bg-white/15 border-white/25 text-white hover:bg-white/25 hover:text-white" onClick={() => setShowPollWizard(true)}>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('connections.action.interest')}</span>
                </Button>
                <Button variant={selectMode ? 'default' : 'outline'} size="sm" className="gap-2 bg-white/15 border-white/25 text-white hover:bg-white/25 hover:text-white" onClick={() => (selectMode ? cancelSelect() : setSelectMode(true))}>
                  {selectMode ? <><X className="w-4 h-4" /> {t('connections.action.cancel')}</> : <><Check className="w-4 h-4" /> {t('connections.action.select')}</>}
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-white/15 border-white/25 text-white hover:bg-white/25 hover:text-white" onClick={() => navigate('/relationship-hub')}>
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('connections.action.hub')}</span>
                </Button>
              </div>
            </div>

            <div className="relative mt-5">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('connections.search_placeholder')}
                className="w-full h-14 ps-12 pe-4 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 text-sm font-medium text-white placeholder:text-white/70 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/25 transition-[border-color,box-shadow] duration-200"
              />
            </div>
          </div>
        </div>

        {/* White content shell */}
        <div className="relative -mt-6 nmood-shell px-4 pt-6 pb-28 space-y-6">
        {!selectMode && (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted">
          {SORTS.map((s) => {
            const Icon = s.icon;
            const activeSort = sort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className={'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium transition-default ' + (activeSort ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
              >
                <Icon className="w-3.5 h-3.5" /> {s.label}
              </button>
            );
          })}
        </div>
      )}

      {conn.loading && connections.length === 0 && incoming.length === 0 && outgoing.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-16">
          <Loader2 className="w-4 h-4 animate-spin" /> {t('connections.loading')}
        </div>
      ) : (
        <>
          {incoming.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {t('connections.section.new_requests')}
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{incoming.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {incoming.map((req, i) => (
                  <IncomingRequestWrapper key={req.id} index={i} request={req} onAccept={handleAccept} onDecline={handleDecline} />
                ))}
              </div>
              {!isPremium && incoming.length > 2 && (
                <button
                  type="button"
                  onClick={() => showUpgrade('view_incoming_requests')}
                  className="mt-3 w-full p-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-center hover:bg-primary/10 transition-default"
                >
                  <p className="text-xs font-medium text-primary">
                    {t('connections.premium.view_limit')}
                  </p>
                </button>
              )}
            </section>
          )}

          {showSentSection && (
            <section>
              <h2 className="text-lg font-semibold mb-3">{t('connections.section.sent_requests')}</h2>
              <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
                {SENT_TAB_KEYS.map((tabKey) => {
                  const count = sentByStatus[tabKey].length;
                  const active = sentTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setSentTab(tabKey)}
                      disabled={count === 0 && !active}
                      className={'flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-medium whitespace-nowrap transition-default ' + (active ? 'bg-nmood-cta text-white' : 'bg-muted text-muted-foreground')}
                    >
                      {t('connections.sent.' + tabKey)} {count > 0 && <span className={active ? 'opacity-80' : 'opacity-60'}>{count}</span>}
                    </button>
                  );
                })}
              </div>
              {sentByStatus[sentTab].length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sentByStatus[sentTab].map((req) => (
                    <RequestCard key={req.id} request={req} onCancel={handleCancel} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">{t('connections.sent.empty', { status: t('connections.sent.' + sentTab).toLowerCase() })}</p>
              )}
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {t('connections.section.my_pals')}
              <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{connections.length}</span>
            </h2>
            {connections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedPals.map((pal) => (
                  <PalCard key={pal.id} {...palCardProps(pal)} />
                ))}
              </div>
            ) : (
              <EmptyPals onDiscover={() => navigate('/discover-people')} />
            )}
          </section>
        </>
      )}

        </div>

        <PalDetailSheet
          pal={selectedPal}
          open={!!selectedPal}
          onOpenChange={(open) => !open && setSelectedPal(null)}
          onMessage={() => { const pid = selectedPal?.pal_user_id; setSelectedPal(null); if (pid) navigate('/messages/' + pid); }}
          onInvite={openInviteFromDetail}
          onViewProfile={() => {
            const palUserId = selectedPal?.pal_user_id;
            setSelectedPal(null);
            if (palUserId) navigate(`/pal/${palUserId}`);
          }}
        />
        <InvitePalSheet pals={invitePals} open={!!invitePals} onOpenChange={(open) => !open && setInvitePals(null)} />
        <PalsAcceptedSheet pal={acceptedPal} open={!!acceptedPal} onOpenChange={(open) => !open && setAcceptedPal(null)} onMessage={() => { const pid = acceptedPal?.pal_user_id; setAcceptedPal(null); if (pid) navigate('/messages/' + pid); }} />
        <InterestPollWizard open={showPollWizard} onOpenChange={setShowPollWizard} />

        {selectMode && selectedIds.size > 0 && (
          <MultiInviteBar count={selectedIds.size} onInvite={handleMultiInvite} onCancel={cancelSelect} />
        )}
      </div>
    </div>
  );
}