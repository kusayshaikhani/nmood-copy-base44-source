import {Link} from 'react-router-dom';
import {useMyExperiences} from '@/lib/my-experiences-live';
import {useSafeBack} from '@/lib/safe-navigation';
export default function Memories(){const {past,loading,error,refresh}=useMyExperiences();const back=useSafeBack('/nmood');
 return <div className="max-w-2xl mx-auto space-y-5 pb-24"><button className="min-h-11 text-primary" onClick={back}>Back</button><h1 className="text-2xl font-bold">Memories</h1>
 {loading?<p role="status">Loading memories…</p>:error?<div role="alert">Memories could not be loaded. <button className="min-h-11" onClick={()=>refresh()}>Try again</button></div>:past.length?<div className="grid grid-cols-2 gap-3">{past.map(e=><Link key={e.id} to={`/experience/${e.id}`} className="rounded-2xl border overflow-hidden">{e.image&&<img src={e.image} alt="" className="aspect-square object-cover"/>}<p className="p-3 font-semibold">{e.title}</p></Link>)}</div>:<p role="status">No memories yet. Your attended experiences will appear here.</p>}
 </div>;
}
