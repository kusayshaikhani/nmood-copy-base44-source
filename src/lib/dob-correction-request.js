import { createOwnedRecord } from '@/api/supabaseRecords';

export const DOB_CORRECTION_ENTITY = 'SupportTicket';

export async function requestDobCorrectionReview(proposedDateOfBirth) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(proposedDateOfBirth || '')) {
    throw new Error('Choose the corrected date of birth before submitting.');
  }
  const requestedAt = new Date().toISOString();
  const record = await createOwnedRecord(DOB_CORRECTION_ENTITY, {
    status: 'open',
    type: 'dob_correction',
    subject: 'Date of birth correction review',
    message: 'The member requested a review of their date of birth.',
    request_type: 'date_of_birth_correction',
    requested_at: requestedAt,
    review_required: true,
    proposed_date_of_birth: proposedDateOfBirth,
    resolution: null,
  });
  if (!record?.id) throw new Error('Nmood could not submit your correction request.');
  return record;
}
