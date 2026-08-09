import React, { useState } from 'react';
import { Search, Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BottomSheet from '@/components/shared/BottomSheet';
import { usePalsForBlocking } from '@/lib/real-pals';
import { useSafety } from '@/lib/safety-store';
import { useLocalization } from '@/lib/i18n/useLocalization';

// Safety Center "Block a Member" — search your connections and block silently.
export default function BlockMemberSheet({ open, onOpenChange }) {
  const { t } = useLocalization();
  const { block, isBlocked } = useSafety();
  const { pals, loading } = usePalsForBlocking();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = pals.filter((p) => !isBlocked(p.id) && (!search || p.name.toLowerCase().includes(search.toLowerCase())));

  const handleBlock = async () => {
    const pal = pals.find((p) => p.id === selectedId);
    if (pal) {
      setSubmitting(true);
      await block({ id: pal.id, name: pal.name, avatar: pal.avatar });
      setSubmitting(false);
    }
    setSearch('');
    setSelectedId(null);
    onOpenChange(false);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('safety.block.title')}>
      <div className="pb-2">
        <p className="text-xs text-muted-foreground mb-3">
          Blocked members can't message you, send invitations, become your Pal, or view your profile — and they disappear from discovery and search. They won't be notified.
        </p>
        <div className="relative mb-3">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full h-10 ps-10 pe-4 text-sm rounded-xl bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default"
          />
        </div>
        <div className="max-h-[40vh] overflow-y-auto no-scrollbar space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No one to block here.</p>
          ) : (
            filtered.map((pal) => (
              <button
                key={pal.id}
                onClick={() => setSelectedId(pal.id)}
                type="button"
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-default text-start ${
                  selectedId === pal.id ? 'border-destructive bg-destructive/5' : 'border-border hover:bg-muted/50'
                }`}
              >
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={pal.avatar} alt={pal.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{(pal.name || '?').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pal.name}</p>
                  <p className="text-xs text-muted-foreground">{pal.city}</p>
                </div>
                {selectedId === pal.id && <Ban className="w-4 h-4 text-destructive" />}
              </button>
            ))
          )}
        </div>
        <Button variant="destructive" className="w-full mt-4 gap-2" disabled={!selectedId || submitting} onClick={handleBlock}>
          <Ban className="w-4 h-4" /> {submitting ? 'Blocking…' : 'Block Member'}
        </Button>
      </div>
    </BottomSheet>
  );
}