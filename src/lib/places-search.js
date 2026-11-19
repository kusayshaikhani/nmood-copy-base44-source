import {invokeSupabaseFunction} from '@/api/supabaseClient';
export async function searchPlaces(intent,{signal,requestId}={}){
 if(typeof requestId!=='string'||!/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(requestId))throw Error('places_unavailable');
 const body=await invokeSupabaseFunction('nmood-places',{activity:intent.activity,city:intent.city,moods:intent.moods,requestId},{signal,retryAuth:false});
 if(body?.contract!=='verified-places-1'||body.source!=='google-places-new'||!Array.isArray(body.rows))throw Error('places_unavailable');
 return body;
}
