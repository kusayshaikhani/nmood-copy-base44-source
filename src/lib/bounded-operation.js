export const RECONCILIATION_TIMEOUT_MS = 8000;

// Native bridge calls cannot be cancelled, but their late results must not
// hold the UI open. Fetch callers also receive an abort signal.
export function withTimeout(operation, timeoutMs = RECONCILIATION_TIMEOUT_MS) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('The request timed out. Please try again.');
      error.code = 'TIMEOUT';
      reject(error);
      controller.abort();
    }, timeoutMs);
  });
  return Promise.race([Promise.resolve().then(() => operation(controller.signal)), deadline])
    .finally(() => clearTimeout(timer));
}
