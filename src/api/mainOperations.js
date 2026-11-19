import { callSupabaseRpc, invokeSupabaseFunction } from '@/api/supabaseClient';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { broadcastInput } from '@/lib/mission-control/operations';
function mainRpc(name, params) {
 if (!MAIN_PASSPORT) throw Error('Main app only.');
 return callSupabaseRpc(name, params);
}
export const previewBroadcast = input => mainRpc('nmood_main_preview_announcement', { p_input: broadcastInput(input) });
export const sendBroadcast = (input, fingerprint, confirmation, key) => mainRpc('nmood_main_send_announcement', { p_input: broadcastInput(input), p_fingerprint: fingerprint, p_confirmation: confirmation, p_key: key });
export const previewMemberDeletion = id => mainRpc('nmood_main_member_deletion_plan', { p_member_id: id });
export const deleteMemberPermanently = (id, confirmation, reason, fingerprint) => {
 if (!MAIN_PASSPORT) throw Error('Main app only.');
 return invokeSupabaseFunction('main-admin-member-delete', { id, confirmation, reason, fingerprint }).catch(error => {
  if(error?.status===409 && error?.error==='FAILED_ROLLED_BACK')return {status:'FAILED_ROLLED_BACK',deleted:false,failure_category:error.failure_category};
  throw error;
 });
};
export const getMyAnnouncements = () => MAIN_PASSPORT ? mainRpc('nmood_main_my_announcements', {}) : Promise.resolve([]);
export const markAnnouncement = (id, read = null, dismissed = null) => mainRpc('nmood_main_mark_announcement', { p_id: id.replace(/^announcement:/, ''), p_read: read, p_dismissed: dismissed });

export const exportDirectory = (input, format, dryRun = false) => {
 if (!MAIN_PASSPORT) throw Error('Main app only.');
 return invokeSupabaseFunction('main-admin-directory-export', {input:broadcastInput(input),format,dry_run:dryRun});
};
export async function saveDirectoryExport(result) {
 const allowed = {csv:'text/csv;charset=utf-8',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
 const format=result?.filename?.split('.').pop();
 if(!allowed[format]||result.mime!==allowed[format]||typeof result.base64!=='string')throw Error('Invalid export');
 const bytes=Uint8Array.from(atob(result.base64),c=>c.charCodeAt(0));
 const file=new File([bytes],`nmood-members.${format}`,{type:result.mime});
 if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Nmood member directory'});return;}
 const url=URL.createObjectURL(file);try{const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();}finally{setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
