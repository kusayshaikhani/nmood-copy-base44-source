import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import SmartImage from '@/components/shared/SmartImage';
const prices={PRICE_LEVEL_INEXPENSIVE:'$',PRICE_LEVEL_MODERATE:'$$',PRICE_LEVEL_EXPENSIVE:'$$$',PRICE_LEVEL_VERY_EXPENSIVE:'$$$$'};
// Accept only the authenticated provider adapter contract; never query/AI cards.
export default function PlacesResults({verifiedResponse=null,loading=false,unavailable=false}) {
 const [notice,setNotice]=useState('');
 const rows=verifiedResponse?.contract==='verified-places-1'&&verifiedResponse?.source==='google-places-new'&&Array.isArray(verifiedResponse.rows)?verifiedResponse.rows.filter(r=>r.id&&r.name):[];
 if(!rows.length)return unavailable?<p role="status" className="px-1 text-sm text-muted-foreground">Places suggestions are temporarily unavailable</p>:loading?<p role="status" className="px-1 text-sm text-muted-foreground">Finding places…</p>:null;
 return <section aria-label="Places near you" className="min-w-0 space-y-4 rounded-3xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
 <h2 className="text-2xl font-bold">Places near you</h2>
 {!rows.length?<p className="text-sm leading-relaxed text-muted-foreground">{loading?'Finding places…':unavailable?'Places suggestions are temporarily unavailable':verifiedResponse?.status==='ready'?'No matching places found. Try another activity or city.':'Places suggestions are temporarily unavailable. Explore On Nmood or create a plan.'}</p>:<><p className="text-xs text-muted-foreground">Google Maps · Price levels are indicative, not exact AED spend. Opening status is not a reservation or availability guarantee.</p>{rows.map(row=><article key={row.id} className="min-w-0 space-y-3 rounded-2xl bg-card p-4 [overflow-wrap:anywhere]">
 {row.photo?.authorized===true&&/^\/api\/places\/photos\/[a-zA-Z0-9_-]+$/.test(row.photo.src)&&<SmartImage src={row.photo.src} alt={row.name} className="aspect-video w-full rounded-xl" fallback={<div className="rounded-xl bg-muted p-8 text-center text-sm">Photo unavailable</div>}/>}
 <h3 className="text-lg font-semibold">{row.name}</h3>
 {row.category&&<p className="text-sm text-muted-foreground">{row.category}</p>}
 {row.description&&<p className="text-sm leading-relaxed">{row.description}</p>}
 {row.address&&<p className="text-sm">{row.address}</p>}
 <div className="flex flex-wrap gap-3 text-sm">{Number.isFinite(row.rating)&&row.rating>=0&&row.rating<=5&&<span>Rating {row.rating}/5</span>}{typeof row.openNow==='boolean'&&<span>{row.openNow?'Open now':'Closed now'}</span>}{prices[row.priceLevel]&&<span>{prices[row.priceLevel]}</span>}</div>
 <div className="flex flex-wrap gap-2 text-sm"><Link className="min-h-11 rounded-xl border p-3" to="/host/create-circle">Create Circle</Link><Link className="min-h-11 rounded-xl border p-3" to="/host/create">Create Experience</Link>{typeof row.address==='string'&&row.address.trim()&&<button className="min-h-11 rounded-xl border px-3" onClick={async()=>{try{await navigator.clipboard.writeText(row.address.trim());setNotice('Address copied.');}catch{setNotice('Could not copy. You can select the address above.');}}}>Copy address</button>}</div>
 </article>)}</>}
 {notice&&<p role="status" className="text-sm">{notice}</p>}
 </section>;
}
