import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import LookingForCard from './LookingForCard';
import LookingForComposer from './LookingForComposer';
import { getActivePosts, getMyPosts } from '@/lib/looking-for-data';

export default function LookingForSection({ member }) {
  const navigate = useNavigate();
  const [showComposer, setShowComposer] = useState(false);
  const activePosts = getActivePosts();
  const myPosts = getMyPosts();

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" /> Looking For...
          </h2>
          <p className="text-xs text-muted-foreground">Lightweight intentions. No pressure, no plans.</p>
        </div>
        <button
          onClick={() => navigate('/looking-for')}
          className="text-xs text-primary font-medium"
          type="button"
        >
          See all
        </button>
      </div>

      {myPosts.length > 0 && (
        <div className="mb-3 space-y-2">
          {myPosts.slice(0, 1).map(post => (
            <LookingForCard key={post.id} post={post} isMine />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowComposer(true)}
        type="button"
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-default text-left mb-3"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Plus className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">What are you looking for?</p>
          <p className="text-xs text-muted-foreground">Post an intention. Expires automatically.</p>
        </div>
      </button>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {activePosts.slice(0, 5).map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 w-72"
          >
            <LookingForCard post={post} compact />
          </motion.div>
        ))}
      </div>

      <LookingForComposer open={showComposer} onOpenChange={setShowComposer} member={member} />
    </section>
  );
}