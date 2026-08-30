import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, UserPlus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import MyExperienceCard from '@/components/my-experiences/MyExperienceCard';
import ShareSheet from '@/components/experience/ShareSheet';
import EmptyState from '@/components/shared/EmptyState';
import { useMyExperiences } from '@/lib/my-experiences-live';
import InvitePalsSheet from '@/components/invite/InvitePalsSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useOriginState } from '@/lib/safe-navigation';

const tabKeys = ['upcoming', 'joined', 'hosted', 'saved', 'past'];
const tabLabelMap = { upcoming: 'experiences.my.tab_upcoming', joined: 'experiences.my.tab_joined', hosted: 'experiences.my.tab_hosted', saved: 'experiences.my.tab_saved', past: 'experiences.my.tab_past' };

const emptyCopy = {
  upcoming: { title: 'Nothing planned just yet.', desc: "Join an experience or create your own — your plans will show up here.", actionLabel: 'Find Experiences' },
  joined: { title: 'No joined experiences yet.', desc: "Once you join, you'll find them here with all the details.", actionLabel: 'Find Experiences' },
  hosted: { title: "You haven't hosted yet.", desc: 'Be the one who brings people together. Create your first experience.', actionLabel: 'Create an Experience' },
  saved: { title: 'Nothing saved yet.', desc: 'Tap the heart on any experience to keep it for later.', actionLabel: 'Browse Experiences' },
  past: { title: 'No memories yet.', desc: "Your past experiences will live here once you've attended something.", actionLabel: 'Find Experiences' },
};

export default function MyExperiences() {
  const navigate = useNavigate();
  const originState = useOriginState();
  const { t } = useLocalization();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [inviteExperience, setInviteExperience] = useState(null);
  const myExperiences = useMyExperiences();

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
            <h1 className="text-2xl font-bold text-white">{t('experiences.my.title')}</h1>
            <p className="text-sm text-white/80 mt-1">{t('experiences.my.subtitle')}</p>
          </div>
        </div>

        {/* White content shell */}
        <div className="relative -mt-6 nmood-shell px-4 pt-6 pb-28">
        <Tabs defaultValue="upcoming">
        <TabsList className="flex w-full justify-start overflow-x-auto no-scrollbar h-auto mb-4">
          {tabKeys.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex-shrink-0">{t(tabLabelMap[tab])}</TabsTrigger>
          ))}
        </TabsList>

        {tabKeys.map((tab) => {
          const items = myExperiences[tab] || [];
          return (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-0">
              {items.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title={emptyCopy[tab]?.title || 'Nothing here yet'}
                  description={emptyCopy[tab]?.desc || "When you join experiences, they'll appear here."}
                  actionLabel={emptyCopy[tab]?.actionLabel}
                  onAction={() => (emptyCopy[tab]?.actionLabel === 'Create an Experience'
                    ? navigate('/host/create', { state: originState() })
                    : navigate('/explore'))}
                />
              ) : (
                items.map((exp) => (
                  <MyExperienceCard
                    key={`${exp.id}-${tab}`}
                    experience={exp}
                    onCancel={setCancelTarget}
                    onShare={setShareTarget}
                    onInvite={setInviteExperience}
                  />
                ))
              )}
            </TabsContent>
          );
        })}
        </Tabs>
        </div>

        <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('experiences.my.cancel_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be removed from "{cancelTarget?.title}". You can rejoin later if spots are available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('experiences.my.cancel_keep')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => setCancelTarget(null)}
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <ShareSheet open={!!shareTarget} onOpenChange={(open) => !open && setShareTarget(null)} experience={shareTarget} />

        <InvitePalsSheet experience={inviteExperience} open={!!inviteExperience} onOpenChange={(open) => !open && setInviteExperience(null)} />
      </div>
    </div>
  );
}