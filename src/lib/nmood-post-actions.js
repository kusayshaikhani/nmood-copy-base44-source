/**
 * UI capability adapter for normal Nmoods. The post itself is fetched through
 * the server-authorized main-feed RPC; this adapter deliberately does not
 * infer a join or message entitlement from a client-side relationship cache.
 */
export function isPublicNmoodAudience(post) {
  const audience = String(post?.visibility || post?.audience || '').trim().toLowerCase();
  return audience === 'public' || audience === 'everyone';
}

export function resolveNmoodMessageCapability({ post, directMessageAccess, isOwner = false }) {
  if (isOwner) return { enabled: false, reason: 'owner' };
  if (!post || post.deleted_at || !post.expires_at || Date.parse(post.expires_at) <= Date.now()) return { enabled: false, reason: 'unavailable' };
  if (!isPublicNmoodAudience(post) && !directMessageAccess?.connected) return { enabled: false, reason: 'audience' };
  if (directMessageAccess?.can_message === true) return { enabled: true, reason: 'authorized' };
  return { enabled: false, reason: directMessageAccess?.reason || 'messaging_policy' };
}

// A normal-Nmood join request needs its own server RPC. No current main-feed
// projection provides one, so the UI remains unavailable until the server
// explicitly attests the action capability.
export function resolveNmoodJoinCapability({ post, serverState, isOwner = false }) {
  if (isOwner || !post || post.deleted_at || !post.expires_at || Date.parse(post.expires_at) <= Date.now()) return { enabled: false, reason: 'unavailable' };
  return serverState?.can_request_to_join === true
    ? { enabled: true, reason: 'authorized' }
    : { enabled: false, reason: serverState?.state || 'server_contract_unavailable' };
}
