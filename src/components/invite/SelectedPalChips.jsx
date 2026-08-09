import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';

export default function SelectedPalChips({ pals, onRemove }) {
  if (!pals || pals.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {pals.map(pal => (
        <div key={pal.id} className="flex items-center gap-1.5 ps-1.5 pe-2 py-1 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
          <Avatar className="w-5 h-5">
            <AvatarImage src={pal.avatar} alt={pal.name} />
            <AvatarFallback className="bg-primary/20 text-primary text-[8px]">{pal.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium whitespace-nowrap">{pal.name.split(' ')[0]}</span>
          <button onClick={() => onRemove(pal.id)} type="button" className="text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}