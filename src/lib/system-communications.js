import {callSupabaseRpc} from '@/api/supabaseClient';
export const READABLE_SYSTEM_EVENTS=new Set(['welcome','announcement','connection_accepted','circle_request_accepted','circle_request_rejected','experience_request_accepted','experience_request_rejected','circle_cancelled','experience_cancelled','safety_notice','photo_verification_approved']);
export function systemMessagePath(id){return typeof id==='string'&&/^(announcement:)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)?'/messages/nmood-admin?message='+encodeURIComponent(id):null;}
export function systemConversation(rows){
 const messages=[...new Map((Array.isArray(rows)?rows:[]).filter(r=>systemMessagePath(r.id)&&r.body).map(r=>[r.id,r])).values()].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)||a.id.localeCompare(b.id));
 return {messages,unread:messages.filter(m=>!m.read_at).length,last:messages.at(-1)};
}
export const getSystemMessages=uid=>callSupabaseRpc('nmood_main_my_system_messages',{}, {expectedUserId:uid});
export const readSystemMessage=(uid,id)=>callSupabaseRpc('nmood_main_read_system_message',{p_id:id}, {expectedUserId:uid});

export const getSystemUnreadCount=uid=>callSupabaseRpc('nmood_main_my_system_unread_count',{}, {expectedUserId:uid});

export const getSystemInboxMessages=uid=>callSupabaseRpc('nmood_main_my_system_inbox_messages',{}, {expectedUserId:uid});
export const hideSystemConversation=(uid,ids)=>callSupabaseRpc('nmood_main_hide_system_inbox',{p_ids:ids}, {expectedUserId:uid});
