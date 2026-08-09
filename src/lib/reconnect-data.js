// RC-005A: reconnectSuggestions removed — was fabricated mock data.
// Reconnect suggestions are now derived from real PalConnection entities
// via useReconnectSuggestions() in real-pals.js.

export const getSnoozedSuggestions = () => {
  try { return JSON.parse(localStorage.getItem('inmood_reconnect_snoozed') || '[]'); } catch { return []; }
};

export const snoozeSuggestion = (id) => {
  const snoozed = getSnoozedSuggestions();
  if (!snoozed.includes(id)) {
    snoozed.push(id);
    localStorage.setItem('inmood_reconnect_snoozed', JSON.stringify(snoozed));
  }
};

export const clearSnoozed = () => {
  localStorage.removeItem('inmood_reconnect_snoozed');
};

export const isReconnectDisabled = () => localStorage.getItem('inmood_reconnect_disabled') === 'true';

export const setReconnectDisabled = (v) => localStorage.setItem('inmood_reconnect_disabled', String(v));

export const getHiddenPals = () => {
  try { return JSON.parse(localStorage.getItem('inmood_reconnect_hidden_pals') || '[]'); } catch { return []; }
};

export const hidePal = (palId) => {
  const hidden = getHiddenPals();
  if (!hidden.includes(palId)) {
    hidden.push(palId);
    localStorage.setItem('inmood_reconnect_hidden_pals', JSON.stringify(hidden));
  }
};

export const unhidePal = (palId) => {
  const hidden = getHiddenPals().filter(id => id !== palId);
  localStorage.setItem('inmood_reconnect_hidden_pals', JSON.stringify(hidden));
};

// RC-005A: getFilteredSuggestions removed — was returning fabricated mock data.
// Filtering is now handled at the component layer using real suggestions
// from useReconnectSuggestions() in real-pals.js.