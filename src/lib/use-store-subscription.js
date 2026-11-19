import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCustomerInfo } from './revenuecat-client';
import { withTimeout } from './bounded-operation';

// Presentation/purchase suppression only. Never grants server-authorized access.
export function useStoreSubscription(waiting = false) {
  const [state, setState] = useState({ loading: true, info: null, error: false });
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    if (!Capacitor.isNativePlatform()) {
      setState({ loading: false, info: null, error: false });
      return null;
    }
    setState({ loading: true, info: null, error: false });
    try {
      const result = await withTimeout(() => getCustomerInfo({ fresh: true }));
      const info = { ...result, hasActiveSubscription: !!result.isPremium || !!result.activeProductIds?.length };
      if (request === generation.current) setState({ loading: false, info, error: false });
      return info;
    } catch {
      if (request === generation.current) setState({ loading: false, info: null, error: true });
      return null;
    }
  }, []);
  useEffect(() => {
    if (waiting) { setState({ loading: true, info: null, error: false }); return; }
    void refresh();
    const foreground = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', foreground);
    return () => { generation.current++; document.removeEventListener('visibilitychange', foreground); };
  }, [waiting, refresh]);
  return { ...state, refresh };
}
