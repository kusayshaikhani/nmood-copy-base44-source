// LC-002 Part 6 — Consent state store.
// Module-level singleton so non-React code (product-analytics, error-reporter)
// can check consent without access to React context.

let _analyticsConsent = false;
let _aiPersonalization = true;

export function setAnalyticsConsent(v) {
  _analyticsConsent = !!v;
}

export function getAnalyticsConsent() {
  return _analyticsConsent;
}

export function setAiPersonalization(v) {
  _aiPersonalization = !!v;
}

export function getAiPersonalization() {
  return _aiPersonalization;
}