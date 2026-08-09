import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Users, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';
import LookingForCard from '@/components/looking-for/LookingForCard';
import LookingForComposer from '@/components/looking-for/LookingForComposer';
import LookingForMatchCard from '@/components/looking-for/LookingForMatchCard';
import { getActivePosts, getMyPosts, getMatches, intentionTemplates } from '@/lib/looking-for-data';

const filterTabs = [
  { value: 'all', label: 'All', icon: '🌍' },
  { value: 'public', label: 'Public', icon: '🌍' },
  { value: 'community', label: 'Community', icon: '🏘️' },
  { value: 'circle', label: 'Circle', icon: '⭕' },
  { value: 'pals', label: 'Pals', icon: '🤝' },
  { value: 'mine', label: 'My Posts', icon: '✨' },
];

export default function LookingFor() {
  const [showComposer, setShowComposer] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const allPosts = getActivePosts();
  const myPosts = getMyPosts();

  const filteredPosts = useMemo(() => {
    let posts = activeFilter === 'mine' ? myPosts : allPosts;
    if (activeFilter !== 'all' && activeFilter !== 'mine') {
      posts = posts.filter(p => p.visibility === activeFilter);
    }
    if (selectedCategory) {
      posts = posts.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      posts = posts.filter(p =>
        p.intention_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.member_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return posts;
  }, [activeFilter, selectedCategory, searchQuery, allPosts, myPosts]);

  const matches = useMemo(() => getMatches(selectedCategory, []), [selectedCategory]);

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Looking For...</h1>
          <p className="text-sm text-muted-foreground">Lightweight intentions. Find your people without the planning.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search intentions..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowComposer(true)} size="icon" className="rounded-xl">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveFilter(tab.value)}
            className={'flex items-center gap-1.5 px-3.5 py-2 rounded-full border whitespace-nowrap transition-default text-sm font-medium ' + (activeFilter === tab.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40')}
          >
            <span className="text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeFilter !== 'mine' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Filter by category</p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={'px-3 py-1.5 rounded-full border whitespace-nowrap text-xs font-medium transition-default ' + (!selectedCategory ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card')}
            >
              All Categories
            </button>
            {intentionTemplates.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setSelectedCategory(t.category === selectedCategory ? null : t.category)}
                className={'flex items-center gap-1 px-3 py-1.5 rounded-full border whitespace-nowrap text-xs font-medium transition-default ' + (selectedCategory === t.category ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card')}
              >
                <span>{t.icon}</span>
                {t.category}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredPosts.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <LookingForCard post={post} isMine={post.member_name === 'You'} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm mb-1">No intentions here yet</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs">Be the first to post what you're looking for. It's fast, casual, and expires automatically.</p>
          <Button onClick={() => setShowComposer(true)} size="sm">
            <Plus className="w-4 h-4" />
            Post an intention
          </Button>
        </div>
      )}

      {activeFilter !== 'mine' && matches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Suggested Matches
            </h2>
            <span className="text-xs text-muted-foreground">Based on interests & location</span>
          </div>
          <div className="space-y-2">
            {matches.map((match, i) => (
              <LookingForMatchCard key={match.id} match={match} index={i} />
            ))}
          </div>
        </section>
      )}

      <LookingForComposer open={showComposer} onOpenChange={setShowComposer} />
    </div>
  );
}