import React, { useState } from 'react';
import { Calendar, Users, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import InterestPollWizard from '@/components/interest-poll/InterestPollWizard';
import { useExperiences } from '@/lib/discover-store';
import { useMergedCircles } from '@/lib/circle-store';

export default function InvitationActions({ pal }) {
  const [sheetType, setSheetType] = useState(null);
  const [sent, setSent] = useState(false);
  const [showPollWizard, setShowPollWizard] = useState(false);
  const { experiences } = useExperiences();
  const mergedCircles = useMergedCircles();

  const handleInvite = () => {
    setSent(true);
    setTimeout(() => { setSent(false); setSheetType(null); }, 1500);
  };

  const actions = [
    { icon: Calendar, label: 'Invite to Experience', color: 'text-primary', bg: 'bg-primary/10', onClick: () => setSheetType('experience') },
    { icon: Users, label: 'Invite to Circle', color: 'text-info', bg: 'bg-info/10', onClick: () => setSheetType('circle') },
    { icon: Crown, label: 'Host Together', color: 'text-warning', bg: 'bg-warning/10', onClick: () => setSheetType('host'), placeholder: true },
    { icon: Sparkles, label: 'Test Interest', color: 'text-accent-foreground', bg: 'bg-accent/20', onClick: () => setShowPollWizard(true) },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Invitations</h2>
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ icon: Icon, label, color, bg, onClick, placeholder }) => (
          <button
            key={label}
            onClick={onClick}
            type="button"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover-lift relative"
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <span className="text-xs font-medium text-center leading-tight">{label}</span>
            {placeholder && (
              <span className="text-[9px] text-muted-foreground/60 absolute top-1.5 right-1.5">Soon</span>
            )}
          </button>
        ))}
      </div>

      <BottomSheet
        open={!!sheetType}
        onOpenChange={(open) => !open && setSheetType(null)}
        title={sheetType === 'host' ? 'Host Together' : `Invite ${pal?.name?.split(' ')[0] || ''}`}
        description={sheetType === 'host' ? 'Co-hosting is coming soon' : `Choose a ${sheetType === 'experience' ? 'experience' : 'circle'} to invite to`}
      >
        <div className="space-y-2 pb-2">
          {sent ? (
            <div className="text-center py-8">
              <p className="text-sm font-medium text-success">Invitation sent!</p>
            </div>
          ) : sheetType === 'host' ? (
            <div className="text-center py-8">
              <Crown className="w-12 h-12 text-warning/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Co-hosting experiences together is a future feature. Stay tuned!</p>
            </div>
          ) : sheetType === 'experience' ? (
            experiences.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No experiences available yet.</p>
            ) : experiences.slice(0, 4).map(exp => (
              <button key={exp.id} onClick={handleInvite} type="button" className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-default text-left">
                <img src={exp.image} alt={exp.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exp.title}</p>
                  <p className="text-xs text-muted-foreground">{exp.date} · {exp.time}</p>
                </div>
              </button>
            ))
          ) : (
            mergedCircles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No circles available yet.</p>
            ) : mergedCircles.slice(0, 4).map(circle => (
              <button key={circle.id} onClick={handleInvite} type="button" className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-default text-left">
                <img src={circle.cover_photo} alt={circle.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{circle.name}</p>
                  <p className="text-xs text-muted-foreground">{circle.member_count || 0} members</p>
                </div>
              </button>
            ))
          )}
        </div>
      </BottomSheet>

      <InterestPollWizard open={showPollWizard} onOpenChange={setShowPollWizard} />
    </section>
  );
}