// Retry only recognized transport/server failures; never retry authorization,
// scope validation, cancellations, or malformed responses.
export function transientHomeFeedError(error) {
 if (!error || error.name==='AbortError' || ['EXPLORER_SCOPE_CHANGED','PT409','42501'].includes(error.code)) return false;
 return [408,429,500,502,503,504].includes(error.status) || error.code==='57014' || (error instanceof TypeError && /fetch|network|load failed/i.test(error.message));
}
export const retryHomeFeed=(count,error)=>count<2&&transientHomeFeedError(error);
