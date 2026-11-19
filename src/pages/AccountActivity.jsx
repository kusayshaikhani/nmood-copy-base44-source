import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { withTimeout } from '@/lib/bounded-operation';
export default function AccountActivity({kind}) {
 const {user}=useAuth();
 const query=useQuery({queryKey:['accountActivity',user?.id,kind],enabled:!!user?.id,retry:false,queryFn:()=>withTimeout(signal=>callSupabaseRpc('nmood_list_my_account_activity',{p_kind:kind},{signal}))});
 const title={views:'Profile Views',received:'Requests Received',sent:'Requests Sent'}[kind];
 return <section className="max-w-2xl mx-auto p-5 space-y-4"><h1 className="text-2xl font-semibold">{title}</h1><p>Recent recorded activity. Dismissed notifications are not included.</p>
 {query.isLoading?<p role="status">Loading activity…</p>:query.error?<div role="alert">{query.error.code==='42501'?<><p>Upgrade to view profile activity.</p><Link to="/upgrade">Upgrade</Link></>:<><p>Activity could not be loaded.</p><button className="min-h-11" onClick={()=>query.refetch()}>Retry</button></>}</div>:!query.data?.length?<p>No recorded activity to show.</p>:query.data.map(item=><article key={item.id} className="rounded-xl border p-4 space-y-2">{item.locked?<><p>Request received</p><Link to="/upgrade">Upgrade</Link></>:<><h2>{item.title}</h2><p>{item.body}</p>{item.path?.startsWith('/')&&!item.path.startsWith('//')&&item.target_available!==false&&<Link className="inline-flex min-h-11 items-center text-primary" to={item.path}>Open</Link>}</>}</article>)}
 {kind!=='views'&&<Link className="inline-flex min-h-11 items-center" to="/pals">Manage Pal requests</Link>}
 </section>;
}
