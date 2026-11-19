import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ChatHeader({ conversation, muted, onMute, onBlock }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const memberName = conversation?.name || 'Member';
  const openProfile = () => navigate('/pal/' + encodeURIComponent(conversation.memberId));

  const menuItems = [
    { label: t('messaging.header.view_profile'), action: openProfile },
    { label: muted ? 'Unmute conversation' : t('messaging.header.mute'), action: onMute },
    { label: t('messaging.header.block'), action: onBlock, destructive: true },
  ];

  return (
    <div className="z-20 flex flex-none shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-2.5 shadow-sm">
      <button
        onClick={() => navigate('/messages')}
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-default flex-shrink-0"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <button type="button" onClick={openProfile} className="relative flex-shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-primary" aria-label={`View ${memberName}'s profile`}>
        <Avatar className="w-10 h-10">
          <AvatarImage src={conversation.avatar} alt={memberName} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {memberName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {conversation.online && (
          <div className="absolute bottom-0 end-0 w-3 h-3 rounded-full bg-success border-2 border-card" />
        )}
      </button>

      <button type="button" onClick={openProfile} className="flex-1 min-w-0 text-start rounded-md focus-visible:ring-2 focus-visible:ring-primary">
        <h2 className="font-semibold text-sm truncate">{memberName}</h2>
        {conversation.presence && (
          <p className="text-xs text-muted-foreground truncate">{conversation.presence}</p>
        )}
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
                  key={item.label}
                  onClick={() => { setMenuOpen(false); item.action?.(); }}
                  className={'w-full text-start px-3.5 py-2 text-sm hover:bg-muted transition-default ' + (item.destructive ? 'text-destructive' : '')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
