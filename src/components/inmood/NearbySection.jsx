import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Loader2, WifiOff, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDiscoverableMembers } from '@/lib/member-update';
import { useAuth } from '@/lib/AuthContext';
import { useMergedCircles } from '@/lib/circle-store';
import { useSafety } from '@/lib/safety-store';
import { travelTime } from '@/lib/inmood-engine';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NearbySection({ items = [] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isBlocked } = useSafety();
  const { t } = useLocalization();
  const isOnline = useOnlineStatus();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mergedCircles = useMergedCircles();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        // AGE-001 — Use the backend discoverMembers action for server-side
        // eligibility filtering (excludes no-DOB, under-18, suspended, deleted,
        // not-onboarded, private members at the query level).
        const res = await fetchDiscoverableMembers(20);
        if (!active) return;
        const filtered = (res || [])
          .filter((m) => m.location_enabled)
          .filter((m) => (m.user_id || m.created_by_id) !== user?.id)
          .filter((m) => !isBlocked(m.user_id || m.created_by_id || m.id))
          .filter((m) => m.profile_view_visibility !== 'private')
          .slice(0, 5);
        setMembers(filtered);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id, isBlocked]);

  const nearbyExperiences = items.slice(0, 5);
  // Circles: only active + discoverable (public/approval) nearby circles.
  const nearbyCircles = mergedCircles
    .filter((c) => (!c.status || c.status === 'active') && (c.privacy === 'public' || c.privacy === 'approval') && (c.tags || []).includes('nearby'))
    .slice(0, 4);

  const hasAnything = nearbyExperiences.length > 0 || nearbyCircles.length > 0 || members.length > 0;

  if (loading && !hasAnything) {
    return (
      <section>
        <h2 className="font-bold text-lg mb-3 px-1">{t('inmood.nearby.title')}</h2>
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-40 h-24 rounded-2xl flex-shrink-0" />
              <Skeleton className="w-40 h-24 rounded-2xl flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // BUG-009 — Offline state.
  if (!isOnline && !hasAnything) {
    return (
      <section>
        <h2 className="font-bold text-lg mb-3 px-1">{t('inmood.nearby.title')}</h2>
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-8 px-4 text-center">
          <WifiOff className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('discovery.offline.title')}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{t('discovery.offline.desc')}</p>
        </div>
      </section>
    );
  }

  if (!hasAnything) {
    return (
      <section>
        <h2 className="font-bold text-lg mb-3 px-1">{t('inmood.nearby.title')}</h2>
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-8 px-4 text-center">
          <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          {/* BUG-010 — Contextual guidance instead of a bare "Nothing nearby". */}
          <p className="text-sm text-muted-foreground">{t('inmood.nearby.empty_title')}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{t('inmood.nearby.empty_desc')}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-bold text-lg mb-3 px-1">{t('inmood.nearby.title')}</h2>

      {nearbyExperiences.length > 0 && (
        <div className="relative h-28 rounded-2xl overflow-hidden border border-border mb-4 bg-gradient-to-br from-primary/15 via-accent/10 to-emerald-100 dark:to-emerald-900/20">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(var(--primary)/0.2) 0, transparent 30%), radial-gradient(circle at 70% 60%, hsl(var(--accent)/0.25) 0, transparent 35%)' }} />
          {nearbyExperiences.map((p, i) => {
            const pos = [
              { top: '25%', left: '20%' }, { top: '55%', left: '45%' }, { top: '35%', left: '72%' }, { top: '70%', left: '30%' }, { top: '40%', left: '58%' },
            ][i % 5];
            return (
              <motion.div key={p.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-md"><MapPin className="w-3 h-3" /></span>
              </motion.div>
            );
          })}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur text-[10px] font-medium text-muted-foreground">{t('inmood.nearby.city_label')}</div>
        </div>
      )}

      {nearbyExperiences.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{t('inmood.nearby.experiences')}</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-1 pb-1">
            {nearbyExperiences.map((p, i) => (
              <motion.button
                key={p.id}
                type="button"
                onClick={() => navigate(`/experience/${p.id}`)}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-40 text-left rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:-translate-y-0.5 transition-default"
              >
                <div className="h-20"><img src={p.image} alt={p.title} className="w-full h-full object-cover" loading="lazy" /></div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold line-clamp-1">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{p.distance} · {travelTime(p.distance)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {nearbyCircles.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{t('inmood.nearby.circles')}</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-1 pb-1">
            {nearbyCircles.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/circle/${c.id}`)}
                className="flex-shrink-0 w-40 text-left rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:-translate-y-0.5 transition-default"
              >
                <div className="h-20"><img src={c.cover_photo} alt={c.name} className="w-full h-full object-cover" loading="lazy" /></div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold line-clamp-1">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><Users className="w-3 h-3" /> {c.member_count} {t('inmood.nearby.members')}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {members.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{t('inmood.nearby.members')}</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-1 pb-1">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate('/discover-people')}
                className="flex-shrink-0 w-32 text-center rounded-2xl border border-border bg-card p-3 hover:-translate-y-0.5 transition-default"
              >
                <Avatar className="w-12 h-12 mx-auto mb-2">
                  <AvatarImage src={m.photo_url} alt={m.display_name} />
                  <AvatarFallback className="text-sm">{(m.display_name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-xs font-semibold line-clamp-1">{m.display_name}</p>
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 mt-1"><MapPin className="w-3 h-3" /> {m.city || t('inmood.nearby.default_city')}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}