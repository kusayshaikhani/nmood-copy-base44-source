export const COVER_OPERATION_TIMEOUT_MS = 30000;

// Race independently of transport cancellation: a native/network promise may
// never settle even after abort. Late results must not advance the save chain.
export function boundedCoverOperation(start, controller) {
  let timer;
  let stop;
  const interrupted = new Promise((_, reject) => {
    stop = () => reject(Object.assign(new Error('Cover cancelled'), { code: 'COVER_CANCELLED' }));
    controller.signal.addEventListener('abort', stop, { once: true });
    timer = setTimeout(() => {
      reject(Object.assign(new Error('Cover timed out'), { code: 'COVER_TIMEOUT' }));
      controller.abort();
    }, COVER_OPERATION_TIMEOUT_MS);
  });
  const work = Promise.resolve().then(() => {
    if (controller.signal.aborted) { stop(); return; }
    return start();
  });
  return Promise.race([interrupted, work]).finally(() => {
    clearTimeout(timer);
    controller.signal.removeEventListener('abort', stop);
  });
}
