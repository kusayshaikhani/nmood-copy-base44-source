// UX-006 — Trust & Safety voice patch. Overrides base en.js keys with warmer,
// confidence-building, human-friendly copy and adds keys for the safety tips
// sheet. Logic untouched — presentation copy only. Other languages fall back
// to English for the new keys via the standard missing-key fallback.
export const safetyTrustPatches = {
  en: {
    // TrustVerification — friendlier toggle states
    'trust.status.enabled': 'On',
    'trust.status.disabled': 'Off',

    // ReportSheet — confidence + transparency
    'safety.report.thank_you': 'Thanks for looking out.',
    'safety.report.review': 'Our team will review this carefully and take action if needed.',

    // OrganizerTrustCard — encouraging, less blunt
    'safety.organizer.not_enough_activity': 'This organizer is just getting started.',

    // SafetyTrustSection — warmer, confidence-building framing
    'experiences.safety.unverified': 'Verification in progress',
    'experiences.safety.unverified_desc': "We're confirming this organizer's identity",

    // SafetyTipsReminderSheet — localized keys (previously hardcoded)
    'safety.tips.subtitle': 'A few reminders before your first experience.',
    'safety.tips.meet_public': 'Meet in public places for your first meetup.',
    'safety.tips.tell_someone': "Tell someone where you're going.",
    'safety.tips.trust_instincts': 'Trust your instincts — you can leave anytime.',
    'safety.tips.review_anytime': 'You can review these anytime in the Safety Center.',
    'safety.tips.got_it': 'Got it — continue',
    'safety.tips.dont_show': "Don't show again",
  },
};