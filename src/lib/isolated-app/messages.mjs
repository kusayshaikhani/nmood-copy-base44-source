// Normal chat DTOs backed exclusively by the authenticated isolated SQL endpoint.
// Each adapter belongs to one memory-only sign-in generation.
export function createIsolatedMessageAdapter(client) {
  const loaded = new Map();
  const row = value => {
    if (!value?.id || !value.conversation_id || !value.sender_id || typeof value.body !== 'string') throw Error('ISOLATED_RESPONSE');
    loaded.set(value.id, value.conversation_id);
    return {...value, message_type: 'text', payload: {}, created_at: value.created_at ?? value.created_date};
  };
  const context = id => {
    const conversation_id = loaded.get(id);
    if (!conversation_id) throw Error('ISOLATED_MESSAGE_NOT_LOADED');
    return conversation_id;
  };
  const resolve = async peer => {
    const value = await client.conversations({action: 'resolve', peer_id: peer});
    if (!value?.id) throw Error('ISOLATED_RESPONSE');
    return value;
  };
  return {
    getOrCreatePrivateConversation: resolve,
    getPrivateMessages: async conversation_id => {
      const values = await client.messages({action: 'list', conversation_id});
      if (!Array.isArray(values)) throw Error('ISOLATED_RESPONSE');
      return values.map(row);
    },
    sendPrivateMessage: async (peer, message = {}) => {
      // Attachments require the separately guarded media-upload contract.
      if ((message.type && message.type !== 'text') || Object.keys(message).some(k => !['type','content','reply_to_id','reply_to_text'].includes(k))) throw Error('ISOLATED_MESSAGE_UNSUPPORTED');
      const conversation = await resolve(peer);
      return row(await client.messages({action: 'send', conversation_id: conversation.id, content: message.content, reply_to_id: message.reply_to_id ?? null}));
    },
    editPrivateMessage: async (id, content) => row(await client.messages({action: 'edit', conversation_id: context(id), id, content})),
    deletePrivateMessage: async id => {
      const result = await client.messages({action: 'delete', conversation_id: context(id), id});
      if (result?.deleted !== true) throw Error('ISOLATED_RESPONSE');
      loaded.delete(id);
      return result;
    },
  };
}
