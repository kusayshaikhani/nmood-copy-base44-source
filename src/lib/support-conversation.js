import { callSupabaseRpc } from '@/api/supabaseClient';

const rows = (value) => Array.isArray(value) ? value : value ? [value] : [];

export const getMySupportThread = async () => rows(await callSupabaseRpc('nmood_get_my_support_thread'))[0] || null;
export const startSupportThread = async (body) => rows(await callSupabaseRpc('nmood_start_support_thread', { p_body: String(body || '').trim() }))[0] || null;
export const sendSupportMessage = async (threadId, body) => callSupabaseRpc('nmood_send_support_message', { p_thread_id: threadId, p_body: String(body || '').trim() });
export const listMySupportMessages = async (threadId) => rows(await callSupabaseRpc('nmood_list_my_support_messages', { p_thread_id: threadId }));
export const markMySupportRead = async (threadId) => callSupabaseRpc('nmood_mark_my_support_read', { p_thread_id: threadId });

export const adminListSupportThreads = async () => {
 const threads=rows(await callSupabaseRpc('admin_list_support_threads'));
 // Identity always comes from this thread's member_id, never a Circle or peer.
 // Resolve only the existing server-authorized profile projection; no raw member read.
 return Promise.all(threads.map(async thread=>{
  let avatar='';
  if(thread.member_id)try{
   const view=await callSupabaseRpc('nmood_get_member_profile',{p_member_id:thread.member_id});
   if(!view?.blocked&&['full','teaser'].includes(view?.tier)&&typeof view.profile?.photo_url==='string')avatar=view.profile.photo_url;
  }catch{ /* A private/unavailable photo uses the member's initials. */ }
  return {...thread,member_avatar:avatar};
 }));
};
export const adminListSupportMessages = async (threadId) => rows(await callSupabaseRpc('admin_list_support_messages', { p_thread_id: threadId }));
export const adminReplySupport = async (threadId, body) => callSupabaseRpc('admin_reply_support_thread', { p_thread_id: threadId, p_body: String(body || '').trim() });
export const adminSetSupportStatus = async (threadId, status) => callSupabaseRpc('admin_set_support_thread_status', { p_thread_id: threadId, p_status: status });

export const canReadAdminSupport = async () => (await callSupabaseRpc('nmood_support_admin_access')) === true;
export const getAdminSupportUnreadCount = async () => Number(await callSupabaseRpc('nmood_admin_support_unread_count')) || 0;
export function notifySupportChanged() {
  window.dispatchEvent(new CustomEvent('nmood:support-changed'));
  window.dispatchEvent(new CustomEvent('nmood:messages-changed'));
}
