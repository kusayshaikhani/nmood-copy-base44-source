import { useEffect, useState } from 'react';
import { normalizeDiscoveryQuery } from './discovery-text-search';

export function useDiscoverySearch(value, delay = 200) {
  const current = normalizeDiscoveryQuery(value);
  const [settled, setSettled] = useState(current);
  useEffect(() => {
    if (!current) { setSettled(''); return; }
    const timer = setTimeout(() => setSettled(current), delay);
    return () => clearTimeout(timer);
  }, [current, delay]);
  // Empty text takes effect synchronously; obsolete timers are cancelled.
  return { query: current ? settled : '', pending: !!current && current !== settled };
}
