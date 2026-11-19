import { ISOLATED_APP_BUILD } from '@/lib/isolated-app/active.mjs';
import { STATUS_TEST_BUILD } from '@/lib/passport-independent/status-build.mjs';
// Main application only; existing isolated and rehearsal clients retain their contracts.
export const MAIN_PASSPORT = !ISOLATED_APP_BUILD && !STATUS_TEST_BUILD && import.meta.env.MODE !== 'rehearsal';
