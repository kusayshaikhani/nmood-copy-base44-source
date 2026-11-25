import {ISOLATED_CUSTOMER_BUILD} from '@/lib/isolated-customer/runtime.mjs';
import {isolatedAppAdapters} from '@/lib/isolated-app/active.mjs';
import { resolveReplyPreviews } from '@/lib/message-replies';
import {
  callSupabaseRpc,
  deleteGroupChatAttachment as deleteStoredGroupAttachment,
  getSignedStorageUrl,
  uploadGroupChatAttachment as uploadStoredGroupAttachment,
} from '@/api/supabaseClient';
import { localSafetyDecision } from '@/lib/local-safety-signals';

const resolvedContainers = new Map();
const SAFE_SERVER_MESSAGES = new Map([
  ['Group chat unavailable.', 'This chat is unavailable because you are not an active member or the activity is no longer active.'],
  ['Only active members can access this chat.', 'This chat is available only to active members.'],
  ['Only active members can send messages.', 'Only active members can send messages here.'],
  ['Attachment is unavailable.', 'That attachment could not be verified for this chat.'],
  ['Unsupported message type.', 'That kind of message is not supported.'],
  ['Message is too large.', 'That message is too large to send.'],
  ['Message text is required.', 'Enter a message before sending.'],
  ['Message text is invalid.', 'The edited message must contain text and be under 4,000 characters.'],
  ['Reply target is invalid.', 'The message you replied to is invalid.'],
  ['Reply target is unavailable.', 'The message you replied to is no longer available.'],
  ['Message unavailable.', 'That message is no longer available or cannot be changed by your account.'],
  ['Only the organizer can pin messages.', 'Only the organizer can pin messages.'],
  ['Reaction is invalid.', 'That reaction is not supported.'],
  ['Safety hold.', 'This message was not delivered. Nmood held it for a private safety review.'],
]);

const OPERATION_CODES = {
  resolve: 'NMG-CHAT-ACCESS', list: 'NMG-CHAT-READ', send: 'NMG-CHAT-SEND',
  edit: 'NMG-CHAT-EDIT', delete: 'NMG-CHAT-DELETE', pin: 'NMG-CHAT-PIN',
  react: 'NMG-CHAT-REACT', upload: 'NMG-CHAT-ATTACH',
};

export function safeGroupChatError(error, operation) {
  const raw = typeof error?.message === 'string' ? error.message.trim() : '';
  if (/\(NMG-CHAT(?:-[A-Z]+)?\)$/.test(raw)) return new Error(raw);
  const safe = SAFE_SERVER_MESSAGES.get(raw)
    || (error?.code === 'PGRST202' ? 'Required rehearsal chat functions are not installed.' : null)
    || (error?.status === 401 ? 'Your session expired. Sign in again.' : null)
    || 'Chat could not complete that action. Please try again.';
  return new Error(`${safe} (${OPERATION_CODES[operation] || 'NMG-CHAT'})`);
}

async function run(operation, action) {
  try { return await action(); }
  catch (error) { throw safeGroupChatError(error, operation); }
}

async function resolveContainer(scope, containerId) {
  const key = scope + ':' + String(containerId);
  if (!resolvedContainers.has(key)) {
    resolvedContainers.set(key, run('resolve', async () => {
      const value = await callSupabaseRpc('nmood_resolve_group_chat_container', {
        p_scope: scope, p_record_id: String(containerId),
      });
      const resolved = Array.isArray(value) ? value[0] : value;
      if (!resolved) throw new Error('Group chat unavailable.');
      return String(resolved);
    }).catch((error) => { resolvedContainers.delete(key); throw error; }));
  }
  return resolvedContainers.get(key);
}

async function hydrateAttachment(scope, message) {
  const filePath = message?.file_url;
  if (!filePath || !filePath.startsWith(scope + '/')) return message;
  return { ...message, file_path: filePath, file_url: await getSignedStorageUrl('chat-attachments', filePath) };
}

export async function getGroupChatContext(scope, containerId) {
  if(ISOLATED_CUSTOMER_BUILD)return isolatedAppAdapters().groupChat.context(scope,containerId);
  return run('list', async () => {
    const resolvedId = await resolveContainer(scope, containerId);
    return callSupabaseRpc('nmood_get_group_chat_context', { p_scope: scope, p_container_id: resolvedId });
  });
}

export async function listGroupChatMessages(scope, containerId) {
  if(ISOLATED_CUSTOMER_BUILD)return isolatedAppAdapters().groupChat.list(scope,containerId);
  return run('list', async () => {
    const resolvedId = await resolveContainer(scope, containerId);
    const rows = await callSupabaseRpc('nmood_list_group_chat_messages', {
      p_scope: scope, p_container_id: resolvedId,
    });
    return Promise.all(resolveReplyPreviews(rows || []).map((message) => hydrateAttachment(scope, message)));
  });
}

export async function sendGroupChatMessage(scope, containerId, message) {
  if(ISOLATED_CUSTOMER_BUILD)return isolatedAppAdapters().groupChat.send(scope,containerId,message);
  return run('send', async () => {
    const resolvedId = await resolveContainer(scope, containerId);
    const localSafety = localSafetyDecision((typeof message.content === 'string' ? message.content : '') + ' ' + (message.file_name || ''));
    const rows = await callSupabaseRpc('nmood_send_group_chat_message', {
      p_scope: scope,
      p_container_id: resolvedId,
      p_message: {
        type: message.type, content: message.content || '',
        file_url: message.file_url || null, file_name: message.file_name || null,
        reply_to_id: message.reply_to_id || null,
        client_safety: { decision: localSafety.decision, rule_version: localSafety.signals[0]?.ruleVersion || 'nmood-local-safety-2026-09-v1' },
      },
    });
    const checked = await Promise.all((rows || []).map(async (row) => ({ row, result: await callSupabaseRpc('nmood_my_message_delivery_result', { p_message_id: row.id }) })));
    if (checked.some(({ result }) => result?.delivery_state === 'held')) throw new Error('Safety hold.');
    window.dispatchEvent(new Event('nmood:group-chat-changed'));
    return Promise.all(checked.map(({ row }) => hydrateAttachment(scope, row)));
  });
}

export const editGroupChatMessage = (messageId, content) => ISOLATED_CUSTOMER_BUILD?isolatedAppAdapters().groupChat.edit(messageId,content):run('edit', () =>
  callSupabaseRpc('nmood_edit_group_chat_message', { p_message_id: messageId, p_content: content }));
export const deleteGroupChatMessage = (messageId) => ISOLATED_CUSTOMER_BUILD?isolatedAppAdapters().groupChat.delete(messageId):run('delete', () =>
  callSupabaseRpc('nmood_delete_group_chat_message', { p_message_id: messageId }));
export const setGroupChatMessagePinned = (messageId, pinned) => run('pin', () =>
  callSupabaseRpc('nmood_set_group_chat_message_pinned', { p_message_id: messageId, p_pinned: pinned }));
export const reactToGroupChatMessage = (messageId, emoji) => run('react', () =>
  callSupabaseRpc('nmood_react_group_chat_message', { p_message_id: messageId, p_emoji: emoji }));

export async function uploadGroupChatAttachment(scope, containerId, file) {
  return run('upload', async () => {
    const resolvedId = await resolveContainer(scope, containerId);
    return uploadStoredGroupAttachment(scope, resolvedId, file);
  });
}

export function deleteGroupChatAttachment(path) { return deleteStoredGroupAttachment(path); }

export const hideGroupChatMessage = (id) => callSupabaseRpc('nmood_hide_group_chat_message',{p_message_id:id});

export async function listCircleConversations() {
 return run('list', () => callSupabaseRpc('nmood_circle_inbox', {}));
}

export async function listGroupChatConversations() {
 return run('list', () => callSupabaseRpc('nmood_group_chat_inbox', {}));
}

export async function getMyUnreadGroupChatCount() {
 return run('list', () => callSupabaseRpc('nmood_my_group_chat_unread_count', {}));
}

export async function markGroupChatRead(scope, containerId) {
 const resolvedId = await resolveContainer(scope, containerId);
 const result = await run('list', () => callSupabaseRpc('nmood_mark_group_chat_read', {
   p_scope: scope,
   p_container_id: resolvedId,
 }));
 window.dispatchEvent(new CustomEvent('nmood:messages-changed'));
 return result;
}
