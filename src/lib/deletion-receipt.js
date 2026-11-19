import { invokeSupabaseFunction } from '@/api/supabaseClient';
const KEY='nmood.deletion-receipt';
export function validDeletionState(value){return value&&['RECOVERY_PENDING','PURGE_PENDING','COMPLETE','RECOVERED'].includes(value.status)&&(value.deletion_mode==='immediate'?['PURGE_PENDING','COMPLETE'].includes(value.status)&&value.recovery_until==null:Number.isFinite(Date.parse(value.recovery_until)));}
export function saveDeletionReceipt(value){
 const snapshot={status:value.status,...(value.deletion_mode?{deletion_mode:value.deletion_mode}:{}),recovery_until:value.recovery_until,checked_at:value.checked_at || new Date().toISOString(),receipt:/^[a-f0-9]{64}$/.test(value.receipt||'')?value.receipt:undefined};
 try{localStorage.setItem(KEY,JSON.stringify(snapshot));}catch{/* UI still confirms before logout; Support can verify identity. */}
 return snapshot;
}
export function readDeletionReceipt(){try{return JSON.parse(localStorage.getItem(KEY));}catch{return null;}}
export async function refreshDeletionReceipt(receipt){
 if(!/^[a-f0-9]{64}$/.test(receipt||''))throw Error('UNAVAILABLE');
 const result=await invokeSupabaseFunction('deletion-status',{receipt},{retryAuth:false});
 if(!validDeletionState(result))throw Error('UNAVAILABLE');return result;
}

export function forgetDeletionReceipt(){try{localStorage.removeItem(KEY);}catch{/* No account or server state is changed. */}}
