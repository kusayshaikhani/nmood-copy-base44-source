import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, UserPlus } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import DiscoverCard from '@/components/discover/DiscoverCard';
import { useExperiences } from '@/lib/discover-store';
import InvitePalsSheet from '@/components/invite/InvitePalsSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function Saved() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [wishlistIds, setWishlistIds] = useState([]);
  const [inviteExperience, setInviteExperience] = useState(null);
  const { experiences } = useExperiences();

  useEffect(() => {
    try {
      setWishlistIds(JSON.parse(localStorage.getItem('inmood_wishlist') || '[]'));
    } catch {
      setWishlistIds([]);
    }
  }, []);

  const wishlistExperiences = (experiences || []).filter((e) => wishlistIds.includes(String(e.id)));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto w-full">
        {/* Gradient hero */}
        <div className="relative bg-nmood-gradient px-4 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-10">
          <div className="absolute inset-0 overflow-hidden">
            <div className="nmood-glow -top-16 -right-12 w-48 h-48 bg-white/20" />
            <div className="nmood-glow top-12 -left-16 w-44 h-44 bg-indigo-300/30" />
          </div>
          <div className="relative">
            <h1 className="text-2xl font-bold text-white">{t('saved.title')}</h1>
            {wishlistExperiences.length > 0 && (
              <p className="text-sm text-white/80 mt-1">{t('saved.count', { count: wishlistExperiences.length })}</p>
            )}
          </div>
        </div>

        {/* White content shell */}
        <div className="relative -mt-6 nmood-shell px-4 pt-6 pb-28">
          {wishlistExperiences.length === 0 ? (
            <EmptyState
              icon={Heart}
              title={t('saved.empty_title')}
              description={t('saved.empty_desc')}
              actionLabel={t('saved.discover_button')}
              onAction={() => navigate('/explore')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlistExperiences.map((exp) => (
                <div key={exp.id}>
                  <DiscoverCard experience={exp} />
                  <button onClick={() => setInviteExperience(exp)} type="button" className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-default">
                    <UserPlus className="w-3.5 h-3.5" /> {t('saved.invite_pals')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <InvitePalsSheet experience={inviteExperience} open={!!inviteExperience} onOpenChange={(open) => !open && setInviteExperience(null)} />
      </div>
    </div>
  );
}