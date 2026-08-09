import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Search, Settings2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CircleMembers({ role, members, onManage }) {
  const [query, setQuery] = useState('');
  const list = (members || []).filter((m) => (m.member_name || '').toLowerCase().includes(query.toLowerCase()));

  const { t } = useLocalization();
  return (
    <div className="space-y-3">
      {role === 'organizer' && (
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={onManage}>
          <Settings2 className="w-4 h-4" />{t('circles.manage_members.title')}</Button>
      )}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('circles.manage_members.search')}
          className="w-full h-10 ps-9 pe-3 rounded-xl bg-muted text-sm focus:bg-card focus:outline-none transition-default"
        />
      </div>
      <div className="space-y-1.5">
        {list.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">{t('circles.members.empty')}</p>
        ) : list.map((m, i) => {
          const isOrg = m.role === 'organizer';
          return (
            <motion.div
              key={m.id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={m.member_avatar} alt={m.member_name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">{(m.member_name || '?').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm truncate">{m.member_name}</p>
                  {isOrg && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      <Crown className="w-2.5 h-2.5" /> {t('experiences.host.organizer')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">{m.role} · Joined {m.joined_date || '—'}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}