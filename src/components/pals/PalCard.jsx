import React from 'react';
import CompactProfile from '@/components/shared/CompactProfile';
export default function PalCard({pal,onView,selectMode,isSelected,onToggleSelect}) {
 const activate=()=>selectMode?onToggleSelect?.(pal.id):onView?.();
 return <div role={selectMode?'checkbox':'link'} aria-checked={selectMode?!!isSelected:undefined} tabIndex={0} aria-label={pal.display_name||pal.name||'Member'} onClick={activate} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}}} data-search-card="people" className={'discovery-card compact-discovery-card unified-card cursor-pointer '+(isSelected?'ring-2 ring-primary':'')}><CompactProfile person={pal} memberId={pal.pal_user_id||pal.raw?.pal_id}/></div>;
}
