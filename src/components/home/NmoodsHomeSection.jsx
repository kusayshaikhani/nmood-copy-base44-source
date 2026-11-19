import {discoveryQuickResults} from '@/lib/discovery-controls';
import {useContractDiscovery} from '@/lib/use-contract-discovery';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { newestFirst } from '@/lib/passport/newest-first';
import RecentCarousel, { RecentHeading } from './premium/RecentCarousel';
import { HOME_LAYOUT } from './home-layout';
import {useNavigate} from 'react-router-dom';
import {useState} from 'react';
import {Sparkles} from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import PublishedNmoodCard from '@/components/nmoods/PublishedNmoodCard';
import {useNmoodPosts} from '@/lib/nmood-posts';
import {useAuth} from '@/lib/AuthContext';
function NmoodsHomeSection({fullList=false,query='',mode='for_you',filters={},useSource=useNmoodPosts}={}){
 const navigate=useNavigate();const {user}=useAuth();const {posts,loading,error,unavailable,refresh,hasNextPage,fetchNextPage}=useSource(query,filters,mode);const [visible,setVisible]=useState(6);const filtered=discoveryQuickResults(MAIN_PASSPORT?newestFirst(posts):posts,mode).filter(post=>`${post.intention_text||''} ${post.category||''}`.toLowerCase().includes(query.trim().toLowerCase()));const shown=filtered.slice(0,visible);
 return <section aria-label="Nmood shares"><RecentHeading title="Nmood shares" to="/nmoods"/>
  {loading?<p role="status">Loading Nmoods…</p>:unavailable?<div role="status"><p>Nmood shares are currently unavailable.</p></div>:error?<div role="alert"><p>Nmoods could not be loaded.</p><button className="min-h-11" onClick={()=>refresh()}>Try again</button></div>:filtered.length===0?<EmptyState compact icon={Sparkles} title={query.trim()?"No matching Nmood shares in your selected area":"No eligible Nmood shares in your selected area yet"} description="Share what you're up for right now." actionLabel="Share a Nmood" onAction={()=>navigate('/nmoods')} secondaryLabel="Explore" onSecondary={()=>navigate('/explore')}/>:<><RecentCarousel label="Nmood shares carousel" fullList={fullList}>{shown.map(post=><li key={post.id} className={fullList?'min-w-0 flex flex-col':`${HOME_LAYOUT.card} flex-col`}>{String(post.owner_id)===String(user?.id)&&<p className="mb-1 text-xs font-semibold text-primary">Your active Nmood</p>}<PublishedNmoodCard post={post}/></li>)}</RecentCarousel>{(shown.length<filtered.length||hasNextPage)&&<button type="button" className="mx-auto mt-3 flex min-h-11 text-primary" onClick={()=>{setVisible(n=>n+6);if(shown.length>=filtered.length&&hasNextPage)void fetchNextPage();}}>Load more Nmoods</button>}</>}
 </section>;
}

function useSearchPosts(query,filters,mode){const result=useContractDiscovery('posts',filters,query,true,mode);return {posts:result.rows,loading:result.loading,error:result.isError,unavailable:result.scopeMissing,refresh:result.refetch,hasNextPage:result.hasNextPage,fetchNextPage:result.fetchNextPage};}
export default function NmoodsSection(props){return <NmoodsHomeSection {...props} useSource={MAIN_PASSPORT&&props?.fullList?useSearchPosts:useNmoodPosts}/>;}
