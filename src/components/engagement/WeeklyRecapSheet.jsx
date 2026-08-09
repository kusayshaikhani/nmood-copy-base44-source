import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Coffee, Users, Calendar, Sparkles } from 'lucide-react';
import { BRAND } from '@/lib/system-config';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export default function WeeklyRecapSheet({ open, onOpenChange, recap }) {
  const items = useMemo(() => {
    if (!recap) return [];
    return [
      { icon: Heart, label: 'New Pals', value: recap.newPals },
      { icon: Coffee, label: 'Experiences Joined', value: recap.experiencesJoined },
      { icon: Users, label: 'Circles Joined', value: recap.circlesJoined },
      { icon: Calendar, label: 'Upcoming Activities', value: recap.upcoming },
    ];
  }, [recap]);

  const hasActivity = recap && (recap.newPals || recap.experiencesJoined || recap.circlesJoined || recap.upcoming);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-4" />
        <SheetHeader className="mb-4">
          <SheetTitle className="text-center text-xl">This week in Nmood</SheetTitle>
          <SheetDescription className="text-center">
            A gentle look back — and a nudge toward what's next.
          </SheetDescription>
        </SheetHeader>

        {!hasActivity ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              A quiet week. There's a real world waiting — explore something new.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-muted/50 border border-border"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{item.value}</span>
                    <span className="text-[11px] text-muted-foreground text-center">{item.label}</span>
                  </motion.div>
                );
              })}
            </div>

            {recap.achievement && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-2"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-primary">Achievement unlocked</p>
                  <p className="font-semibold text-sm">{recap.achievement.title}</p>
                </div>
              </motion.div>
            )}

            <p className="text-center text-xs text-muted-foreground mt-3">
              {BRAND.slogan_inline}
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}