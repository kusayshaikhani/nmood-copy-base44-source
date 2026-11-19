// Server time and ownership checks remain authoritative. This only controls UI.
export function canUnsend(message, now = Date.now()) {
 const created = Date.parse(message?.created_at);
 return message?.sender === 'me' && !message?.unsent_at && !message?.protected &&
  Number.isFinite(created) && now >= created && now - created <= 15 * 60 * 1000;
}
export function canHideMessage(message) { return !!message?.id && !message.protected; }
