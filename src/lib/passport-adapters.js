// Transport integration inventory, not permission grants. All SQL guards remain server-side.
export const PASSPORT_ADAPTERS = Object.freeze([
 { signature: 'public.nmood_0059_discovery_base(integer)', mode: 'regional' },
 { signature: 'public.nmood_main_post_visible(uuid)', mode: 'regional' },
 { signature: 'public.nmood_profile_summary_allowed(uuid,text)', mode: 'regional' },
 { signature: 'public.nmood_get_member_profile(uuid)', mode: 'regional' },
 { signature: 'public.nmood_authorize_public_place_map(uuid,uuid)', mode: 'server-only' },
 { signature: 'public.nmood_join_circle(uuid,uuid)', mode: 'regional' },
 { signature: 'public.nmood_join_experience(uuid,uuid)', mode: 'regional' },
 { signature: 'public.nmood_require_container(text,uuid)', mode: 'existing-participant' },
 { signature: 'public.nmood_activity_identity_allowed(uuid,boolean)', mode: 'regional' },
 { signature: 'public.nmood_member_indicators_internal(uuid)', mode: 'regional' },
 { signature: 'public.nmood_gallery_viewer_not_blocked(uuid)', mode: 'regional' },
 { signature: 'public.nmood_0059_notifications_base(integer)', mode: 'regional' },
 { signature: 'public.nmood_my_notification_unread_count()', mode: 'regional' },
 { signature: 'public.nmood_list_my_account_activity(text)', mode: 'regional' },
 { signature: 'public.nmood_discovery_allowed()', mode: 'regional' },
 { signature: 'public.nmood_0059_circle_submit(uuid)', mode: 'regional' },
 { signature: 'public.nmood_0059_experience_submit(uuid)', mode: 'regional' },
 { signature: 'public.nmood_0059_pal_submit(uuid,text)', mode: 'regional' },
 { signature: 'public.send_pal_request(uuid,text,uuid)', mode: 'regional' },
 { signature: 'public.nmood_members_may_interact(uuid,uuid)', mode: 'existing-participant' },
 { signature: 'public.nmood_direct_message_access(uuid)', mode: 'existing-participant' },
 { signature: 'public.nmood_can_use_group_chat(text,uuid)', mode: 'existing-participant' },
 { signature: 'public.nmood_get_circle_membership_state(uuid)', mode: 'existing-participant' },
 { signature: 'public.nmood_get_experience_attendance_state(uuid)', mode: 'existing-participant' },
 { signature: 'public.nmood_0059_invitations_base(text)', mode: 'regional' },
 { signature: 'public.nmood_push_delivery_allowed(uuid,text,uuid,text,uuid)', mode: 'server-only' },
 { signature: 'public.nmood_connection_request_push_allowed(uuid)', mode: 'server-only' },
 { signature: 'public.nmood_is_circle_member(uuid,uuid)', mode: 'existing-participant' },
 { signature: 'public.nmood_is_experience_attendee(uuid,uuid)', mode: 'existing-participant' }
]);
export const DESTINATION_RPC_NAMES = Object.freeze([
 ...PASSPORT_ADAPTERS.filter(p => p.mode === 'regional').map(p => p.signature.split('.')[1].split('(')[0]),
 'list_new_pals', 'nmood_list_discoverable_members', 'nmood_get_member_profile_details',
 'nmood_list_member_indicators', 'nmood_get_profile_cover', 'nmood_list_main_posts',
 'nmood_publish_main_post', 'nmood_update_main_post', 'nmood_request_to_join_main_post',
 'nmood_main_post_join_state', 'nmood_list_my_notifications', 'nmood_list_my_invitations',
 'nmood_send_circle_invitations', 'nmood_send_experience_invitations',
 'nmood_respond_circle_invitation', 'nmood_respond_experience_invitation',
 'nmood_create_premium_content',
]);
// Retired home-country confirmation calls have no source-backed destination binding.
export const RETIRED_PASSPORT_RPC_NAMES = Object.freeze(['nmood_list_my_unconfirmed_passport_content','nmood_confirm_my_passport_content','nmood_confirm_my_passport_content_batch']);
const regionalRPCs = new Set([...DESTINATION_RPC_NAMES,...RETIRED_PASSPORT_RPC_NAMES]);
export const DESTINATION_TABLES = Object.freeze(['app_records','members','member_profiles','circles','experiences','circle_invitations','experience_invitations','member_activity_notifications','pal_requests']);
const serverOnly = new Set(PASSPORT_ADAPTERS.filter(p => p.mode === 'server-only').map(p => p.signature.split('.')[1].split('(')[0]));
// Existing participant RPCs still execute their own server gates, including new-contact
// checks where applicable; country unavailability must not block safety/private chat.
export function passportRequestMode(path) {
 const name = path.split('/rest/v1/rpc/')[1]?.split('?')[0];
 if (serverOnly.has(name)) return 'server-only';
 if (regionalRPCs.has(name)) return 'regional';
 if (/^\/rest\/v1\/(app_records|members|member_profiles|circles|experiences|circle_invitations|experience_invitations|member_activity_notifications|pal_requests)(\?|$)/.test(path)) return 'regional';
 return 'existing';
}
export function beginPassportRequest(runtime, path, actor) {
 if (!runtime.enabled) return null;
 const mode = passportRequestMode(path);
 if (mode === 'server-only') throw new Error('This operation requires server authorization.');
 return mode === 'regional' ? runtime.ticket(actor) : null;
}
export function finishPassportRequest(runtime, ticket, actor) {
 if (ticket) runtime.accept(ticket, actor);
}
