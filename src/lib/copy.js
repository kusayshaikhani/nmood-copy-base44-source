// Encouraging, human-language copy for success moments and friendly error
// messages. Replaces generic confirmations ("Saved.", "Unknown error.")
// with Nmood's warmer voice. Keep these short — they're toasts.

export const SUCCESS_COPY = {
  saved: { title: 'Saved for later' },
  unsaved: { title: 'Removed from saved' },
  joined: { title: "See you there!", description: "We'll remind you before it starts." },
  left: { title: "You've left", description: 'We hope to see you soon.' },
  requestSent: { title: 'Hello sent!', description: "They'll see your request soon." },
  requestFailed: { title: "We couldn't send that", description: 'Please try again in a moment.' },
  invitationSent: { title: 'Invitations sent!' },
  invitationFailed: { title: "We couldn't send that", description: 'Please try again in a moment.' },
  rated: { title: 'Thanks for sharing', description: 'Your feedback helps others.' },
  palsConnected: { title: "You're now Pals!" },
  profileSaved: { title: "You're all set." },
  settingsSaved: { title: "You're all set." },
  circleJoined: { title: 'Welcome to the Circle!' },
  circleLeft: { title: "You've left the Circle" },
  circleCreated: { title: 'Your Circle is live!' },
  circleUpdated: { title: "You're all set." },
  experienceCreated: { title: 'Your experience is live!' },
  experienceUpdated: { title: "You're all set." },
  blocked: { title: 'They can no longer reach you.' },
  unblocked: { title: 'They can reach you again.' },
  reported: { title: 'Thanks for flagging that.' },
  removedPal: { title: 'Pal removed.' },
  membershipUpgraded: { title: 'Welcome to Premium!', description: "You've unlocked everything." },
  experienceLeft: { title: "You've left the experience." },
  invitationDeclined: { title: 'Invitation declined.' },
  eligibilityVerified: { title: "You're all set!", description: 'Your age has been confirmed.' },
};

export const ERROR_COPY = {
  generic: { title: "We couldn't complete that right now", description: 'Please try again in a moment.' },
  network: { title: 'Connection trouble', description: 'Check your internet and try again.' },
  notFound: { title: "We couldn't find that", description: 'It may have been removed or moved.' },
};

// Map a thrown error to a friendly message. Falls back to generic.
export const friendlyError = (err) => {
  const msg = (err && (err.message || err.error || err.toString?.())) || '';
  if (/network|fetch|timeout|offline|failed to fetch|econnaborted/i.test(msg)) {
    return ERROR_COPY.network;
  }
  if (/not found|404|does not exist/i.test(msg)) {
    return ERROR_COPY.notFound;
  }
  return ERROR_COPY.generic;
};