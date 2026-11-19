import {getSupabaseSession} from '@/api/supabaseClient';
import {supabaseConfig} from '@/config/supabase-config';
import {moderatorObservationEnabled} from '@/lib/moderator-observation-config';
import {withTimeout} from '@/lib/bounded-operation';

// Rehearsal-only consumer. Never builds a Storage URL or stores attachment bytes persistently.
export async function downloadObservationAttachment(sessionId,messageId) {
 const {baseUrl,publishableKey}=supabaseConfig;
 if(!moderatorObservationEnabled)throw new Error('Unavailable');
 const session=getSupabaseSession();if(!session?.access_token||!session.user?.id)throw new Error('Unavailable');
 const started=Date.now();
 const blob=await withTimeout(async signal=>{
  const response=await fetch(baseUrl+'/functions/v1/moderator-observation-attachment',{
   method:'POST',headers:{apikey:publishableKey,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({session_id:sessionId,message_id:messageId}),signal,cache:'no-store'});
  if(!response.ok)throw new Error('Unavailable');
  const ttlMs=Math.min(60,Number(response.headers.get('X-Observation-Lifetime')))*1000;
  if(!Number.isFinite(ttlMs)||ttlMs<=0)throw new Error('Unavailable');
  const bytes=await response.blob();
  if(bytes.size>26214400)throw new Error('Unavailable');
  const remaining=ttlMs-(Date.now()-started);
  if(remaining<=0)throw new Error('Unavailable');
  return {blob:bytes,ttlMs:remaining};
 }, 20000);
 if(getSupabaseSession()?.user?.id!==session.user.id)throw new Error('Unavailable');
 return blob;
}
