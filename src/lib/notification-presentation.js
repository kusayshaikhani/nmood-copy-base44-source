// Presentation only: authoritative activity, ownership and Messages remain unchanged.
export const notificationFilters = [
  ['all', 'All'], ['unread', 'Unread'], ['requests', 'Requests'],
  ['profile', 'Profile activity'], ['messages', 'Messages'],
  ['community', 'Community'], ['system', 'System'],
];
const incoming = new Set(['connection_request', 'circle_join_request', 'experience_join_request', 'circle_invitation', 'experience_invitation']);
const community = n => /^(circle|experience)_/.test(n._type || '');
const request = n => incoming.has(n._type) || /^(connection_|pal_)/.test(n._type || '') || /(?:request|invitation)/.test(n._type || '');
const message = n => ['direct_message', 'message_reply'].includes(n._type) || n.tab === 'messages';
export function notificationSection(n) {
  if (n._locked || incoming.has(n._type)) return 'Action needed';
  if (message(n)) return 'Messages';
  if (community(n)) return 'Circles & Experiences';
  if (n._type === 'profile_view' || request(n)) return 'Profile activity';
  return 'System';
}
export function matchesNotificationFilter(n, filter) {
  if (filter === 'unread') return !n.read;
  if (filter === 'requests') return request(n) || n._locked === true;
  if (filter === 'profile') return n._type === 'profile_view';
  if (filter === 'messages') return message(n);
  if (filter === 'community') return community(n);
  if (filter === 'system') return notificationSection(n) === 'System';
  return true;
}
export function groupNotifications(items) {
  const sections = ['Action needed', 'Profile activity', 'Messages', 'Circles & Experiences', 'System'];
  return ['Today', 'Yesterday', 'Earlier'].map(label => ({
    label,
    sections: sections.map(section => ({ label: section, items: items.filter(n =>
      (n.group === 'today' ? 'Today' : n.group === 'yesterday' ? 'Yesterday' : 'Earlier') === label && notificationSection(n) === section),
    })).filter(section => section.items.length),
  })).filter(group => group.sections.length);
}
