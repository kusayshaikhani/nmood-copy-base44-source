// RC-005A — All mock notification arrays removed (dead code).
// notifications-store.js is now the primary source (real entity queries).
// Only notificationSettings is retained — imported by Notifications.jsx.

// MP-010: label/description are resolved at presentation layer via
// t('notifications.settings.<id>') and t('notifications.settings.<id>_desc').
export const notificationSettings = [
  { id: 'activity_reminders', enabled: true },
  { id: 'pal_requests', enabled: true },
  { id: 'messages', enabled: true },
  { id: 'hosting', enabled: true },
  { id: 'marketing', enabled: false },
  { id: 'system', enabled: true },
];