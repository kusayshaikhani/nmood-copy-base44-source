import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Heart, HelpCircle, MessageCircle, Calendar, MoreHorizontal, Volume2, VolumeX, Trash2, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SmartConversionSheet from './SmartConversionSheet';

const visibilityIcons = {
  public: '🌍',
  community: '🏘️',
  circle: '⭕',
  pals: '🤝',
  private_invite: '🔒',
};

export default function LookingForCard({ post, isMine = false, compact = false }) {
  const [responded, setResponded] = useState(null);
  const [showConversion, setShowConversion] = useState(false);
  const [muted, setMuted] = useState(post.muted);

  const handleRespond = (type) => {
    setResponded(type);
    setTimeout(() => setResponded(null), 2000);
  };

  return (
    <div className={'relative rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-default ' + (compact ? '' : 'w-full')}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={post.member_avatar} alt={post.member_name} />
          <AvatarFallback>{post.member_name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm truncate">{post.member_name}</p>
            <span className="text-xs">{visibilityIcons[post.visibility]}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{post.visibility_label}</p>
        </div>
        {isMine && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-1.5 rounded-lg hover:bg-muted">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMuted(!muted)}>
                {muted ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                {muted ? 'Unmute replies' : 'Mute replies'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-start gap-2 mb-3">
        <span className="text-2xl flex-shrink-0">{post.intention_icon}</span>
        <p className="text-sm leading-snug pt-0.5">{post.intention_text}</p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {post.distance || post.member_city}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {post.expires_at}
        </span>
      </div>

      {!compact && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {post.interested_count > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
              <Heart className="w-3 h-3" /> {post.interested_count} interested
            </span>
          )}
          {post.maybe_count > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
              <HelpCircle className="w-3 h-3" /> {post.maybe_count} maybe
            </span>
          )}
          {post.message_count > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-info/10 text-info text-xs font-medium">
              <MessageCircle className="w-3 h-3" /> {post.message_count}
            </span>
          )}
        </div>
      )}

      {isMine && (post.interested_count + post.maybe_count >= 4) && (
        <button
          onClick={() => setShowConversion(true)}
          type="button"
          className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-3 hover:from-primary/15 hover:to-accent/15 transition-default"
        >
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs font-medium text-primary text-left flex-1">Enough interest! Convert to an Experience?</p>
        </button>
      )}

      {!isMine && !compact && (
        <div className="grid grid-cols-4 gap-1.5">
          <Button
            size="sm"
            variant={responded === 'interested' ? 'default' : 'outline'}
            onClick={() => handleRespond('interested')}
            className="flex-col h-auto py-2"
          >
            <Heart className="w-4 h-4" />
            <span className="text-[10px]">Interested</span>
          </Button>
          <Button
            size="sm"
            variant={responded === 'maybe' ? 'default' : 'outline'}
            onClick={() => handleRespond('maybe')}
            className="flex-col h-auto py-2"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px]">Maybe</span>
          </Button>
          <Button
            size="sm"
            variant={responded === 'message' ? 'default' : 'outline'}
            onClick={() => handleRespond('message')}
            className="flex-col h-auto py-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-[10px]">Message</span>
          </Button>
          <Button
            size="sm"
            variant={responded === 'invite' ? 'default' : 'outline'}
            onClick={() => handleRespond('invite')}
            className="flex-col h-auto py-2"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px]">Invite</span>
          </Button>
        </div>
      )}

      {!isMine && compact && (
        <Button
          size="sm"
          variant={responded === 'interested' ? 'default' : 'outline'}
          onClick={() => handleRespond('interested')}
          className="w-full"
        >
          <Heart className="w-3.5 h-3.5" />
          {responded === 'interested' ? 'Interested!' : 'I\'m Interested'}
        </Button>
      )}

      <AnimatePresence>
        {responded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-primary text-primary-foreground py-2 text-center text-xs font-medium"
          >
            {responded === 'interested' && 'Response sent! They\'ll be notified.'}
            {responded === 'maybe' && 'Marked as maybe. No pressure!'}
            {responded === 'message' && 'Opening conversation...'}
            {responded === 'invite' && 'Pick an experience to invite them to.'}
          </motion.div>
        )}
      </AnimatePresence>

      <SmartConversionSheet open={showConversion} onOpenChange={setShowConversion} post={post} />
    </div>
  );
}