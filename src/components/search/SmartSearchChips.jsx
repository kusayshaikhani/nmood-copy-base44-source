import React from 'react';
export default function SmartSearchChips({chips, dismissed, onRemove}) {
 const active=chips.filter(chip=>!dismissed.includes(chip.id));
 if(!active.length) return null;
 return <div role="group" aria-label="Understood filters" className="flex min-w-0 flex-wrap gap-2">
  {active.map(chip=><button key={chip.id} type="button" onClick={()=>onRemove(chip.id)} aria-label={`Remove ${chip.label}`} className="min-h-11 max-w-full rounded-full border border-primary/20 bg-primary/5 px-3.5 py-2 text-left text-sm text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [overflow-wrap:anywhere]">
   {chip.label.replace(/^Activity: /,'').replace(/^Public place: /,'').replace(/^./,v=>v.toUpperCase())}<span aria-hidden="true" className="ml-2">×</span>
  </button>)}
 </div>;
}
