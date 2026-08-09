import React from 'react';
import { ArrowLeft, Phone, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ChatHeader({ conversation }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    t('messaging.header.view_profile'),
    t('messaging.header.mute'),
    t('messaging.header.clear'),
    t('messaging.header.block'),
  ];

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-card">
      <button
        onClick={() => navigate('/messages')}
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-default flex-shrink-0"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={conversation.avatar} alt={conversation.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {conversation.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {conversation.online && (
          <div className="absolute bottom-0 end-0 w-3 h-3 rounded-full bg-success border-2 border-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-sm truncate">{conversation.name}</h2>
        <p className="text-xs text-muted-foreground">
          {conversation.online ? t('messaging.header.online') : t('messaging.header.last_seen')}
        </p>
      </div>

      <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-default flex-shrink-0">
        <Phone className="w-5 h-5 text-primary" />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-default flex-shrink-0"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute end-0 top-11 z-50 w-48 bg-card border border-border rounded-xl shadow-lg py-1.5">
              {menuItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-start px-3.5 py-2 text-sm hover:bg-muted transition-default"
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}