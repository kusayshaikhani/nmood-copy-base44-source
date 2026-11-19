import {useSearchParams} from 'react-router-dom';
import {useSafeBack} from '@/lib/safe-navigation';
import DiscoveryStatus from '@/components/shared/DiscoveryStatus';
export function matchesListingCategory(row,category){
 if(!category)return true;
 const aliases={arts:'art',nature:'outdoor'};
 const normalize=value=>aliases[String(value).trim().toLowerCase()]||String(value).trim().toLowerCase();
 return [row.category,...(Array.isArray(row.shared_interests)?row.shared_interests:[])].filter(Boolean).some(v=>normalize(v)===normalize(category));
}
export default function DedicatedListing({title,rows,query,renderItem}){
 const [params,setParams]=useSearchParams();const back=useSafeBack('/');const category=params.get('category')||'';
 const filtered=rows.filter(row=>matchesListingCategory(row,category));
 return <div className="max-w-4xl mx-auto space-y-5 pb-24"><button className="min-h-11 text-primary" onClick={back}>Back</button><h1 className="text-2xl font-bold">{title}</h1>
 {category&&<button className="min-h-11 rounded-full border px-4" onClick={()=>setParams({},{replace:true})}>{category} × Clear category</button>}
 {query.loading||query.isError?<DiscoveryStatus label={title} loading={query.loading} error={query.isError} onRetry={query.refetch}/>:filtered.length?<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(row=><div key={row.id}>{renderItem(row)}</div>)}</div>:<p role="status">No {category?`${category} `:''}{title.toLowerCase()} available yet.</p>}
 </div>;
}
