import React, {useState} from 'react';
import {Copy, MapPin} from 'lucide-react';
const text=value=>typeof value==='string'?value.trim():'';
// Only fields already projected by smart-search-1. Never inspect private/raw
// address fields, coordinates, author profiles or gallery metadata.
export function searchLocation(kind,row) {
 const parts=(kind==='people'?[row.city]:kind==='posts'?[row.location]:[row.location,row.location_area,row.location_city]).map(text).filter(Boolean);
 const unique=[...new Set(parts)];
 const venue=kind==='people'?'':text(row.location);
 const usable=venue.length>=3&&venue.length<=500&&!/https?:|www\.|[<>]|^[-+\d.,\s]+$|^(?:unknown|n\/a|none|tbd)$/i.test(venue)&&![text(row.location_city),text(row.location_area)].includes(venue);
 return {label:unique.join(' · '),copy:usable?unique.join(', '):null};
}
export default function SearchLocation({kind,row,copyAction=false}) {
 const location=searchLocation(kind,row);const [status,setStatus]=useState('');
 if(!location.label)return null;
 const copy=async()=>{try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(location.copy);setStatus('Address copied');}catch{setStatus('Could not copy. You can select the address above.');}};
 return <div className="min-w-0 space-y-1"><p className="flex min-w-0 items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"><MapPin size={14} aria-hidden="true" className="mt-0.5 shrink-0"/><span className="select-text [overflow-wrap:anywhere]">{location.label}</span></p>{copyAction&&location.copy&&<button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs font-medium text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300"><Copy size={14} aria-hidden="true"/>Copy address</button>}{status&&<p role="status" className="text-xs leading-relaxed text-muted-foreground">{status}</p>}</div>;
}
