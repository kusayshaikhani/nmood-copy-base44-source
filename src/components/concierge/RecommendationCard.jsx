import React, { useState } from 'react';
import { MapPin, Clock, Bookmark, Share2, ArrowRight, Navigation, Sparkles, Star, User, Eye, UserPlus, CalendarPlus, Calendar, X, Circle as CircleIcon } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import SmartImage from '@/components/shared/SmartImage';

export default function RecommendationCard({ rec, conversationId, onHidden }) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'join_circle' | 'join_exp' | 'connect' | null

  const handleSave = async () => {
    if (saved) return;
    try {
      await base44.entities.ConciergeSaved.create({
        user_id: String(user.id),
        conversation_id: conversationId || '',
        item_type: rec.type || 'venue',
        title: rec.title || '',
        category: rec.category || '',
        image_url: rec.image_url || '',
        location: rec.location || '',
        price_range: rec.price_range || '',
        why_it_matches: rec.why_it_matches || '',
        item_data: JSON.stringify(rec),
      });
      setSaved(true);
      toast({ title: 'Saved', description: 'Added to your collection.' });
    } catch {
      toast({ title: 'Could not save', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleHide = async (action = 'hidden') => {
    if (hidden) return;
    setHidden(true);
    try {
      await base44.entities.ConciergePreference.create({
        user_id: String(user.id),
        conversation_id: conversationId || '',
        item_type: rec.type,
        item_id: String(rec.id || ''),
        action,
      });
      toast({ title: action === 'not_interested' ? 'Noted' : 'Hidden', description: "We'll improve future suggestions." });
      onHidden?.(rec);
    } catch {
      setHidden(false);
      toast({ title: 'Could not hide', variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    const text = `${rec.title}${rec.location ? ` — ${rec.location}` : ''}${rec.price_range ? ` (${rec.price_range})` : ''}`;
    if (navigator.share) {
      try { await navigator.share({ title: rec.title, text }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(text); toast({ title: 'Copied' }); } catch { /* ignore */ }
    }
  };

  const handleViewDetails = () => {
    if (rec.type === 'experience' && rec.id) navigate(`/experience/${rec.id}`);
    else if (rec.type === 'circle' && rec.id) navigate(`/circle/${rec.id}`);
    else if (rec.type === 'member' && rec.id) navigate(`/pal/${rec.id}`);
  };

  const handleDirections = () => {
    if (rec.location) window.open(`https://www.google.com/maps/search/${encodeURIComponent(rec.location)}`, '_blank');
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction === 'join_circle' && rec.id) {
        const resp = await base44.functions.invoke('authorizationGate', {
          action: 'joinCircle',
          circleId: String(rec.id),
        });
        const res = resp?.data || resp;
        if (res.error === 'limit_reached') {
          toast({ title: 'Limit reached', description: 'Upgrade to Premium for unlimited circle joins.', variant: 'destructive' });
          return;
        }
        if (res.error || !res.ok) {
          toast({ title: 'Could not join', description: res.message || 'Please try again.', variant: 'destructive' });
          return;
        }
        toast({ title: 'Joined!', description: `You've joined ${rec.title}.` });
      } else if (confirmAction === 'join_exp' && rec.id) {
        const resp = await base44.functions.invoke('authorizationGate', {
          action: 'joinExperience',
          experienceId: String(rec.id),
        });
        const res = resp?.data || resp;
        if (res.error === 'limit_reached') {
          toast({ title: 'Limit reached', description: 'Upgrade to Premium for unlimited experience joins.', variant: 'destructive' });
          return;
        }
        if (res.error || !res.ok) {
          toast({ title: 'Could not join', description: res.message || 'Please try again.', variant: 'destructive' });
          return;
        }
        toast({ title: 'You\'re going!', description: `You've joined ${rec.title}.` });
      } else if (confirmAction === 'connect' && rec.user_id) {
        const resp = await base44.functions.invoke('authorizationGate', {
          action: 'requestConnection',
          receiverId: String(rec.user_id),
        });
        const res = resp?.data || resp;
        if (res.error === 'limit_reached') {
          toast({ title: 'Limit reached', description: 'Upgrade to Premium for unlimited connections.', variant: 'destructive' });
          return;
        }
        if (res.error || !res.ok) {
          toast({ title: 'Could not connect', description: res.message || 'Please try again.', variant: 'destructive' });
          return;
        }
        toast({ title: 'Request sent!', description: `Connection request sent to ${rec.title}.` });
      }
    } catch (err) {
      const errData = err?.response?.data || err;
      if (errData?.error === 'limit_reached') {
        toast({ title: 'Limit reached', description: 'Upgrade to Premium for unlimited access.', variant: 'destructive' });
      } else {
        toast({ title: 'Could not complete', description: 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setConfirmAction(null);
    }
  };

  if (hidden) return null;

  const isMember = rec.type === 'member';
  const isCircle = rec.type === 'circle';
  const isExperience = rec.type === 'experience';
  const isInspirational = rec.type === 'inspirational' || rec.is_inspirational === true;
  const hasId = !!rec.id && !isInspirational;
  const isDemo = rec.is_demo === true;

  // Source label — clearly distinguishes real listings from inspirational ideas.
  const sourceLabel = isInspirational
    ? 'Inspirational'
    : isDemo
      ? 'Demo'
      : isExperience
        ? 'Nmood Experience'
        : isCircle
          ? 'Nmood Circle'
          : isMember
            ? 'Member'
            : '';

  const TypeIcon = isInspirational ? Sparkles : isMember ? User : isCircle ? CircleIcon : Calendar;

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-soft">
      {/* Image / Avatar */}
      {rec.image_url && (
        <div className="relative h-28 bg-gradient-to-br from-primary/10 to-accent/15 overflow-hidden">
          <SmartImage src={rec.image_url} alt={rec.title} rounded="rounded-none" className="w-full h-full" />
          {isDemo && !isInspirational && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold">
              Demo
            </span>
          )}
          {isInspirational && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/80 text-white text-[10px] font-semibold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Inspirational
            </span>
          )}
          {rec.match_score > 0 && !isInspirational && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
              <Star className="w-2.5 h-2.5" />
              {rec.match_score}
            </div>
          )}
        </div>
      )}
      <div className="p-3.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <TypeIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              {sourceLabel && (
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                  isInspirational
                    ? 'bg-primary/15 text-primary'
                    : isDemo
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-primary/10 text-primary'
                }`}>
                  {sourceLabel}
                </span>
              )}
              {rec.category && !isInspirational && <span className="text-[10px] font-medium text-primary uppercase tracking-wide">{rec.category}</span>}
              {rec.match_label && !isInspirational && (
                <span className="text-[10px] font-semibold text-primary/70">{rec.match_label}</span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate">{rec.title}</h3>
          </div>
        </div>

        {rec.short_explanation && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{rec.short_explanation}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-2">
          {rec.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {rec.location}</span>}
          {rec.date_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rec.date_time}</span>}
          {rec.price_range && <span className="flex items-center gap-1 font-medium">{rec.price_range}</span>}
          {isCircle && rec.member_count > 0 && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {rec.member_count} members</span>}
          {isExperience && rec.spots_remaining != null && rec.spots_remaining > 0 && (
            <span className="flex items-center gap-1 text-success"><CalendarPlus className="w-3 h-3" /> {rec.spots_remaining} spots left</span>
          )}
        </div>

        {/* Why it matches */}
        {rec.why_it_matches && (
          <div className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 mb-2.5 ${
            isInspirational ? 'bg-primary/[0.08]' : 'bg-primary/[0.05]'
          }`}>
            {isInspirational ? <Sparkles className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" /> : <Star className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />}
            <p className="text-[11px] text-primary/90 leading-snug">{rec.why_it_matches}</p>
          </div>
        )}

        {/* Inspirational notice — only for inspirational items */}
        {isInspirational && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30 px-2.5 py-1.5 mb-2.5">
            <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-snug">
              Suggestions are inspirational. Please verify current details, prices, opening hours, and availability.
            </p>
          </div>
        )}

        {/* Confirmation overlay for join/connect actions */}
        {confirmAction && (
          <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-3 mb-2.5 animate-fade-in">
            <p className="text-xs font-medium text-foreground mb-2">
              {confirmAction === 'join_circle' && `Join "${rec.title}"?`}
              {confirmAction === 'join_exp' && `RSVP to "${rec.title}"?`}
              {confirmAction === 'connect' && `Send a connection request to ${rec.title}?`}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={handleConfirmAction}
                className="flex-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold py-1.5 hover:opacity-90 transition-default">
                Confirm
              </button>
              <button type="button" onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-lg border border-border text-xs font-medium py-1.5 hover:bg-muted transition-default">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {!confirmAction && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* View Details — for real items with an ID */}
            {hasId && (
              <button type="button" onClick={handleViewDetails}
                className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 hover:opacity-90 transition-default">
                <Eye className="w-3 h-3" /> View
              </button>
            )}

            {/* Type-specific primary action */}
            {isCircle && hasId && rec.registrations_open !== false && (
              <button type="button" onClick={() => setConfirmAction('join_circle')}
                className="flex items-center gap-1 rounded-lg bg-nmood-cta text-primary-foreground text-xs font-semibold px-3 py-1.5 hover:shadow-soft transition-default">
                <UserPlus className="w-3 h-3" /> Join
              </button>
            )}
            {isExperience && hasId && rec.spots_remaining > 0 && (
              <button type="button" onClick={() => setConfirmAction('join_exp')}
                className="flex items-center gap-1 rounded-lg bg-nmood-cta text-primary-foreground text-xs font-semibold px-3 py-1.5 hover:shadow-soft transition-default">
                <CalendarPlus className="w-3 h-3" /> RSVP
              </button>
            )}
            {isMember && hasId && rec.user_id && (
              <button type="button" onClick={() => setConfirmAction('connect')}
                className="flex items-center gap-1 rounded-lg bg-nmood-cta text-primary-foreground text-xs font-semibold px-3 py-1.5 hover:shadow-soft transition-default">
                <UserPlus className="w-3 h-3" /> Connect
              </button>
            )}

            {/* Directions — opens a safe Google Maps search. Hidden when no location is available. */}
            {rec.location && (
              <button type="button" onClick={handleDirections}
                className="flex items-center gap-1 rounded-lg border border-border text-muted-foreground text-xs font-medium px-2.5 py-1.5 hover:bg-muted transition-default"
                title="Search in Google Maps">
                <Navigation className="w-3 h-3" /> Directions
              </button>
            )}

            {/* Save */}
            <button type="button" onClick={handleSave}
              className={`flex items-center justify-center rounded-lg border px-2.5 py-1.5 transition-default ${saved ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-muted-foreground hover:bg-muted'}`}
              title="Save">
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>

            {/* Not interested — only for real items with a stable ID */}
            {hasId && (
              <button type="button" onClick={() => handleHide('not_interested')}
                className="flex items-center justify-center rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground hover:bg-muted transition-default"
                title="Not interested">
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Share */}
            <button type="button" onClick={handleShare}
              className="flex items-center justify-center rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground hover:bg-muted transition-default"
              title="Share">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}