import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SmartConversionSheet({ open, onOpenChange, post }) {
  const navigate = useNavigate();

  const handleHostExperience = () => {
    onOpenChange(false);
    navigate('/host/create');
  };

  const handleCreateMeetup = () => {
    onOpenChange(false);
    navigate('/host/create');
  };

  const totalInterest = (post?.interested_count || 0) + (post?.maybe_count || 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-4" />
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Enough interest to make it official!
          </SheetTitle>
          <SheetDescription>
            {totalInterest} people responded to your "{post?.intention_icon} {post?.category}" intention. Turn it into something real.
          </SheetDescription>
        </SheetHeader>

        {post && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted mb-4">
            <Avatar className="w-8 h-8">
              <AvatarImage src={post.member_avatar} alt={post.member_name} />
              <AvatarFallback>{post.member_name?.[0]}</AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground flex-1 truncate">
              "{post.intention_text}"
            </p>
          </div>
        )}

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleHostExperience}
            type="button"
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-default text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Host an Experience</p>
              <p className="text-xs text-muted-foreground">Create a full event with date, venue, and capacity. Perfect for structured meetups.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateMeetup}
            type="button"
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-accent/40 bg-accent/5 hover:bg-accent/10 transition-default text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Create a Circle Meetup</p>
              <p className="text-xs text-muted-foreground">Casual recurring meetup within one of your circles. Low commitment, high connection.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-accent-foreground flex-shrink-0" />
          </motion.button>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Not now, keep it casual
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}