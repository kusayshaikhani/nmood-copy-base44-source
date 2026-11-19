import React, { useEffect, useState } from 'react';
import { Loader2, Search, Sparkles } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { loadNmoodPosts } from '@/lib/nmood-posts';
import { useAuth } from '@/lib/AuthContext';

export default function NmoodPickerSheet({ open, onOpenChange, onPick }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || !user?.id) return;
    let active = true;
    setLoading(true);
    loadNmoodPosts(user.id)
      .then((rows) => { if (active) setItems(rows || []); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, user?.id]);

  const filtered = items.filter((post) => {
    const text = `${post.intention_text || ''} ${post.category || ''}`.toLowerCase();
    return !query || text.includes(query.toLowerCase());
  });

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Share Nmood Share">
      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Nmood Shares" className="w-full h-11 ps-9 pe-3 rounded-xl bg-muted text-sm focus:outline-none" />
      </div>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : filtered.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">No Nmood Shares available to share.</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((post) => (
            <button key={post.id} type="button" onClick={() => onPick({ id: post.id, title: post.intention_text || 'Nmood Share', image: post.image_url || post.cover_image || '', detail: post.category || post.location_name || '' })} className="flex w-full items-center gap-3 rounded-xl p-2 text-start hover:bg-muted transition-default">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center overflow-hidden flex-shrink-0">
                {post.image_url || post.cover_image ? <img src={post.image_url || post.cover_image} alt="" className="w-full h-full object-cover" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium line-clamp-2">{post.intention_text || 'Nmood Share'}</p><p className="text-xs text-muted-foreground truncate">{post.category || post.location_name || ''}</p></div>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
