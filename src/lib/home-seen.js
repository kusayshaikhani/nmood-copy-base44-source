// Device-local, account-scoped opaque card IDs only. No profile/content text.
const prefix='nmood:home-seen:v1:';const lifetime=7*24*60*60*1000;
const valid=/^(people|circles|experiences|posts):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function recentHomeViews(actor,{storage,now=Date.now()}={}){
 if(!actor)return [];
 try {storage||=globalThis.localStorage;const raw=JSON.parse(storage.getItem(prefix+actor)||'[]');return(Array.isArray(raw)?raw:[]).filter(x=>valid.test(x?.key)&&Number.isFinite(x.at)&&x.at<=now&&x.at>now-lifetime).sort((a,b)=>b.at-a.at).slice(0,200);}catch{return [];}
}
export function markHomeViewed(actor,key,options={}){
 if(!actor||!valid.test(key))return;
 try{const storage=options.storage||globalThis.localStorage;const now=options.now??Date.now();const rows=recentHomeViews(actor,{storage,now}).filter(x=>x.key!==key);storage.setItem(prefix+actor,JSON.stringify([{key,at:now},...rows].slice(0,200)));}catch{/* Storage-disabled browsers still have a working feed. */}
}
