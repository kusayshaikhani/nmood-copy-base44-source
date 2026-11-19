export function discoveryErrorMessage(error) {
 if (error?.code==='42501') return 'Discovery is unavailable for this account. Check that onboarding and account eligibility are complete. Your filters have not been applied.';
 if (error?.code==='PT409'||String(error?.message).includes('EXPLORER_SCOPE_CHANGED')) return 'Your discovery country or membership changed. Refresh to search your current area.';
 return 'Search could not be loaded. Please try again; no unfiltered results are shown.';
}
