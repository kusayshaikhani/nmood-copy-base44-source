/**
 * Pure helpers over release-definition. No side effects, no network.
 * Used by the Founder view; the backend function re-derives readiness from
 * live signals + the definition payload.
 */
import { MODULES, QUALITY_GATES } from './release-definition';

export function moduleReadiness() {
  if (!MODULES.length) return 0;
  const sum = MODULES.reduce((acc, m) => acc + (m.completion || 0), 0);
  return Math.round(sum / MODULES.length);
}

export function gateStatusCounts() {
  const counts = { passed: 0, in_progress: 0, open: 0 };
  for (const g of QUALITY_GATES) counts[g.status] = (counts[g.status] || 0) + 1;
  return counts;
}

export function gateReadiness() {
  if (!QUALITY_GATES.length) return 0;
  const score = QUALITY_GATES.reduce((acc, g) => {
    if (g.status === 'passed') return acc + 1;
    if (g.status === 'in_progress') return acc + 0.5;
    return acc;
  }, 0);
  return Math.round((score / QUALITY_GATES.length) * 100);
}

export function overallReadiness() {
  return Math.round(moduleReadiness() * 0.6 + gateReadiness() * 0.4);
}

export function incompleteModules() {
  return MODULES.filter((m) => m.status !== 'complete').sort((a, b) => a.completion - b.completion);
}

export function openGates() {
  return QUALITY_GATES.filter((g) => g.status !== 'passed');
}

export function blockers() {
  return openGates().filter((g) => g.status === 'open');
}

/**
 * RM-002 Architecture Rule. Classify any incoming engineering request.
 * Returns { inRelease, reason }.
 */
export function classifyRequest(featureKey) {
  if (!featureKey) return { inRelease: false, reason: 'No feature key provided.' };
  const key = String(featureKey).toLowerCase();
  const hit = MODULES.find((m) => m.key === key || m.name.toLowerCase() === key);
  if (hit) {
    return {
      inRelease: true,
      module: hit.name,
      reason: `Belongs to Release 1.0 module "${hit.name}". Continue implementation.`,
    };
  }
  return {
    inRelease: false,
    reason: `"${featureKey}" is not a Release 1.0 module. Classified as Release 1.1 Candidate. Do not implement without explicit approval.`,
  };
}