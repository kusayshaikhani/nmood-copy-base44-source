// PV-i18n — Photo/identity + phone verification UI strings.
// English is the source; other languages fall back to English (admin-facing MC
// strings and launch-safe user copy). Add translations as they become available.

export const verificationPatches = {
  en: {
    'trust.dialog.photo_title': 'Photo verification',
    'trust.dialog.photo_explanation': 'A quick, private check so members know you are real. A human reviewer approves it — no facial scanning.',
    'trust.dialog.photo_purpose': 'We compare a fresh selfie with a prompted pose to confirm you are a real person. This is manual — no biometric matching, no face embeddings stored.',
    'trust.dialog.photo_retention': 'Your photos are stored privately and deleted within 30 days of review. They never appear in your profile or gallery.',
    'trust.dialog.photo_consent': 'I consent to this verification and understand how my photos are used and deleted.',
    'trust.dialog.photo_continue': 'Continue',
    'trust.dialog.photo_prompt': 'Choose a pose to do in your selfie',
    'trust.dialog.photo_submit': 'Submit for review',
    'trust.dialog.photo_pending': 'A reviewer will approve this shortly. You will be notified.',
    'trust.dialog.photo_resubmit': 'Resubmit',
    'trust.status.pending': 'In review',
    'trust.action.verify_photo': 'Verify photo',
    'mission.photo_verification_queue': 'Photo Verification Queue',
    'mission.no_photo_verifications': 'No pending photo verifications.',
    'mission.photo_review': 'Review photo verification',
    'mission.photo_reason': 'Reason (shown to user for reject / resubmission)',
    'common.submitting': 'Submitting…',
  },
};