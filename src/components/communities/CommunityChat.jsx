import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Pin, Crown, Shield, Sparkles, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

const roleBadges = {
  owner: { icon: Crown, class: 'bg-primary/10 text-primary' },
  admin: { icon: Shield, class: 'bg-chart-4/10 text-chart-4' },
  moderator: { icon: Sparkles, class: 'bg-chart-2/10 text-chart-2' },
  member: null,
};

export default function CommunityChat({ community }) {
  const { t } = useLocalization();
  const [messages, setMessages] = useState(community.chat_messages || []);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, {
      sender_name: 'You',
      sender_avatar: '',
      sender_role: 'member',
      type: 'text',
      content: input.trim(),
      is_pinned: false,
    }]);
    setInput('');
  };

  const pinned = messages.filter((m) => m.is_pinned);
  const regular = messages.filter((m) => !m.is_pinned);

  return (
    <div className="flex flex-col h-full">
      {pinned.length > 0 && (
        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 mb-3 flex items-start gap-2">
          <Pin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary mb-1">{t('experiences.chat.pinned_announcement')}</p>
            <p className="text-sm leading-relaxed">{pinned[0].content}</p>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
        {regular.map((msg, i) => {
          const isMe = msg.sender_name === 'You';
          const badge = roleBadges[msg.sender_role];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={msg.sender_avatar} alt={msg.sender_name} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{msg.sender_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className={`max-w-[75%] ${isMe ? 'text-end' : ''}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-medium">{isMe ? 'You' : msg.sender_name}</span>
                  {badge && (
                    <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full ${badge.class}`}>
                      <badge.icon className="w-2.5 h-2.5" />
                      {msg.sender_role}
                    </span>
                  )}
                </div>
                {msg.type === 'announcement' ? (
                  <div className="px-3 py-2 rounded-2xl rounded-tl-md bg-primary/10 border border-primary/20 text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'rounded-tr-md bg-primary text-primary-foreground' : 'rounded-tl-md bg-muted'}`}>
                    {msg.content}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t('community.chat.placeholder')}
          className="flex-1 h-10 px-3.5 rounded-xl bg-muted border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-default"
        />
        <Button size="icon" onClick={send} disabled={!input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}