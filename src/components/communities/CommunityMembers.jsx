import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Crown, Shield, Sparkles, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

const roleConfig = {
  owner: { icon: Crown, class: 'bg-primary/10 text-primary', label: 'Owner' },
  admin: { icon: Shield, class: 'bg-chart-4/10 text-chart-4', label: 'Admin' },
  moderator: { icon: Sparkles, class: 'bg-chart-2/10 text-chart-2', label: 'Moderator' },
  member: { icon: null, class: 'bg-muted text-muted-foreground', label: 'Member' },
};

const filters = ['All', 'Owners', 'Admins', 'Moderators', 'Members'];

export default function CommunityMembers({ community }) {
  const { t } = useLocalization();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = (community.members || []).filter((m) => {
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' ||
      (filter === 'Owners' && m.role === 'owner') ||
      (filter === 'Admins' && m.role === 'admin') ||
      (filter === 'Moderators' && m.role === 'moderator') ||
      (filter === 'Members' && m.role === 'member');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('community.members.search')}
          className="w-full h-10 ps-10 pe-4 rounded-xl bg-muted border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-default"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-default border whitespace-nowrap ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full gap-2">
        <UserPlus className="w-4 h-4" />{t('community.members.invite')}</Button>

      <div className="space-y-1.5">
        {filtered.map((m, i) => {
          const cfg = roleConfig[m.role] || roleConfig.member;
          const RoleIcon = cfg.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={m.avatar} alt={m.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">{m.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm truncate">{m.name}</p>
                  {RoleIcon && (
                    <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full ${cfg.class}`}>
                      <RoleIcon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Joined {m.joined_date}</p>
              </div>
              {m.role !== 'owner' && (
                <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}