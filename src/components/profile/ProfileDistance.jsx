import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { withTimeout } from '@/lib/bounded-operation';

// Use only the server's viewer-relative projection. Never fetch owner coordinates,
// request permission automatically, or derive distance from a city/country label.
export default function ProfileDistance({ distance, allowed = true }) {
  const [granted, setGranted] = useState(false);
  useEffect(() => {
    let active = true;
    let generation = 0;
    let permission;
    const check = async () => {
      const attempt = ++generation;
      setGranted(false);
      try {
        const result = await withTimeout(async () => {
          if (Capacitor.isNativePlatform()) return (await Geolocation.checkPermissions()).location === 'granted';
          if (!navigator.permissions?.query) return false;
          permission = await navigator.permissions.query({ name: 'geolocation' });
          return permission.state === 'granted';
        });
        if (active && attempt === generation) {
          setGranted(result);
          if (permission) permission.onchange = check;
        }
      } catch { /* Unknown permission fails closed without blocking the profile. */ }
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') void check(); else { generation++; setGranted(false); } };
    void check();
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      generation++;
      if (permission) permission.onchange = null;
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [distance, allowed]);
  if (!allowed || !granted || typeof distance !== 'number' || !Number.isInteger(distance) || distance < 0) return null;
  return <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold mb-2">Distance</h2><p className="text-sm font-medium">Approximately {distance} km away</p></div>;
}
