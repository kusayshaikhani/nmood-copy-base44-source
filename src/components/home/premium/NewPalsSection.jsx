import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Users } from 'lucide-react';
import { fetchDiscoverableMembers } from '@/lib/member-update';
import { resolveMemberPhoto } from '@/lib/member-photo';
import { resolveMemberNames } from '@/lib/member-names';
import { MEMBER_NAME_FALLBACK } from '@/lib/member-display';
import { useLocalization } from '@/lib/i18n/useLocalization';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

/**
 * NEW PALS — Last Home section.
 * Horizontally scrollable row of newly joined discoverable member cards.
 * Excludes self, blocked, suspended, incomplete, private/non-discoverable
 * (enforced server-side by discoverMembers). Does NOT exclude demo/test
 * members during preview. Shows a compact empty state with Find Pals CTA
 * when genuinely no eligible results — never unmounts after loading to
 * avoid layout shift / flicker.
 */
export default function NewPalsSection() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [pals, setPals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const members = await fetchDiscoverableMembers(50);
        if (!active) return;
        const sorted = (members || [])
          .filter((m) => m.created_date)
          .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
          .slice(0, 12);
        const userIds = sorted.map((m) => m.user_id || m.created_by_id).filter(Boolean);
        const names = await resolveMemberNames({ userIds });
        const enriched = sorted.map((m) => ({
          ...m,
          name: names[m.user_id || m.created_by_id] || m.display_name || MEMBER_NAME_FALLBACK,
        }));
        if (active) {
          setPals(enriched);
          setLoading(false);
        }
      } catch {
        if (active) {
          setPals([]);
          setLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  const getInitials = (name) =>
    (name || '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleCardClick = (pal) => {
    if (pal.user_id || pal.created_by_id) {
      navigate(`/pal/${pal.user_id || pal.created_by_id}`);
    }
  };

  // --- Loading skeleton: header placeholder + card placeholders.
  // No real header text is rendered during loading so nothing can flicker
  // or disappear when the query resolves empty.
  if (loading) {
    return (
      <section aria-label={t('home.new_pals')} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-muted shimmer" />
            <div className="w-28 h-5 rounded-full bg-muted shimmer" />
          </div>
          <div className="w-12 h-4 rounded-full bg-muted shimmer" />
        </div>
        <div className="w-48 h-3 rounded-full bg-muted shimmer" />
        <div className="-mx-6 px-6 overflow-x-auto no-scrollbar momentum-scroll">
          <div className="flex gap-3 pb-2 w-max">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="flex-shrink-0 w-[140px] flex flex-col items-center p-3 rounded-card border border-border bg-card"
              >
                <div className="w-16 h-16 rounded-full bg-muted shimmer mb-2" />
                <div className="w-20 h-3 rounded-full bg-muted shimmer mb-1" />
                <div className="w-16 h-2.5 rounded-full bg-muted shimmer" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // --- Resolved empty: compact honest empty state with Find Pals CTA.
  // Section stays mounted to avoid blank dead area above MobileNav.
  if (pals.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        aria-label={t('home.new_pals')}
      >
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-5 h-5 text-primary" />
          <h2 className="text-section-title">{t('home.new_pals')}</h2>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-card border border-border bg-card">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t('home.new_pals_empty_title')}</p>
            <p className="text-xs text-muted-foreground">{t('home.new_pals_empty_desc')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/search?tab=pals')}
            className="flex-shrink-0 px-4 py-2 rounded-button bg-nmood-cta text-primary-foreground text-sm font-semibold shadow-soft transition-default pressable min-h-[44px]"
          >
            {t('home.new_pals_find_pals')}
          </button>
        </div>
      </motion.section>
    );
  }

  // --- Resolved with pals: horizontal scroll cards.
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      aria-label={t('home.new_pals')}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <h2 className="text-section-title">{t('home.new_pals')}</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/search?tab=pals')}
          className="text-sm text-primary font-medium transition-default hover:underline"
        >
          {t('home.see_all')}
        </button>
      </div>
      <p className="text-caption mb-4">{t('home.new_pals_subtitle')}</p>

      <div className="-mx-6 px-6 overflow-x-auto no-scrollbar momentum-scroll">
        <div className="flex gap-3 pb-2 w-max">
          {pals.map((pal) => {
            const initials = getInitials(pal.name);
            const meta = pal.city || t('home.new_member');
            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => handleCardClick(pal)}
                className="flex-shrink-0 w-[140px] flex flex-col items-center text-center p-3 rounded-card border border-border bg-card hover:shadow-card transition-default pressable"
              >
                <ProfileAvatar
                  src={resolveMemberPhoto(pal)}
                  alt={pal.name}
                  initials={initials}
                  className="w-16 h-16 mb-2"
                  fallbackClassName="bg-gradient-to-br from-primary to-accent text-white text-lg font-bold"
                />
                <h3 className="text-sm font-semibold truncate w-full">{pal.name}</h3>
                <p className="text-xs text-muted-foreground truncate w-full">{meta}</p>
              </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}