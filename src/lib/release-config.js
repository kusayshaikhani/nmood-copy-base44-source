// RM-003 Release configuration — single source of truth for release version,
// build number, build date, environment, and commit identifier.
// Displayed only inside the Admin portal (never to members).
import { ENVIRONMENT } from './runtime-env';

export const RELEASE = Object.freeze({
  version: '1.0.1',
  buildNumber: '20260804.1',
  buildDate: '2026-08-04T16:00:00.000Z',
  environment: ENVIRONMENT,
  commitId: import.meta.env?.VITE_COMMIT_ID || '',
  frozen: true,
  freezeDate: '2026-08-04T16:00:00.000Z',
  releaseStage: 'rc3',
});

export function getReleaseSummary() {
  return {
    version: RELEASE.version,
    buildNumber: RELEASE.buildNumber,
    buildDate: RELEASE.buildDate,
    environment: RELEASE.environment,
    commitId: RELEASE.commitId || '—',
  };
}