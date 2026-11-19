import React, {useState} from 'react';
import {useAuth} from '@/lib/AuthContext';
import {useHardDelete} from './HardDeleteProvider';
const labels={Experience:'Experience',Circle:'Circle',Nmood:'Nmood share',PrivateMessage:'Private message',GroupMessage:'Group message',Membership:'Membership record',Member:'Member and authentication account'};
export default function ResourceDeletionPanel(){
 const {user}=useAuth(),{requestHardDelete}=useHardDelete();const [entity,E]=useState('Experience'),[id,I]=useState('');
 if(!['admin','founder'].includes(user?.role))return null;
 return <details className="my-4 rounded border border-destructive/40 p-3"><summary>Administrator permanent deletion</summary>
 <p className="text-sm my-2">Remove a record by its exact ID. Related records and owned media are removed. Member deletion includes owned groups and the authentication account. Membership removal does not cancel billing with Apple or Google.</p>
 <label>Resource<select value={entity} onChange={e=>E(e.target.value)} className="m-2 border p-2">{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 <label>Record UUID<input aria-label="Record UUID" value={id} onChange={e=>I(e.target.value.trim())} className="m-2 border p-2"/></label>
 <button className="text-destructive p-2" disabled={!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)} onClick={async()=>{const r=await requestHardDelete({entity,id,label:`${labels[entity]} ${id}`});if(r?.ok)I('');}}>Review permanent deletion</button>
 </details>;
}
