// Only non-secret attempt IDs and request signatures are retained. An ambiguous
// network failure reuses the same ID on retry; confirmed outcomes release it.
const pending = new Map();
export const outgoingRequestRpcs = new Set(['send_pal_request', 'nmood_join_circle', 'nmood_join_experience']);
export function requestSubmission(functionName, params, actorId) {
  if (!outgoingRequestRpcs.has(functionName)) return null;
  const signature = JSON.stringify([actorId, functionName, params]);
  if (!pending.has(signature)) pending.set(signature, params.p_submission_id || crypto.randomUUID());
  return { signature, params: { ...params, p_submission_id: pending.get(signature) } };
}
export function finishSubmission(attempt, error) {
  if (attempt && (!error || (error.status >= 400 && error.status < 500))) pending.delete(attempt.signature);
}
