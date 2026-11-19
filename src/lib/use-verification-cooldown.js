import { useEffect, useState } from 'react';
const KEY = 'nmood:verification_retry_after'; // Timestamp only, no mailbox or credentials.
export function useVerificationCooldown() {
  const [until, setUntil] = useState(() => {
    try { const value = Number(sessionStorage.getItem(KEY)); return Number.isFinite(value) ? value : 0; } catch { return 0; }
  });
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (until <= Date.now()) return;
    const timer = setInterval(() => { const current = Date.now(); setNow(current); if (current >= until) clearInterval(timer); }, 1000);
    return () => clearInterval(timer);
  }, [until]);
  const start = (seconds = 60) => {
    const deadline = Date.now() + seconds * 1000;
    setNow(Date.now()); setUntil(deadline);
    try { sessionStorage.setItem(KEY, String(deadline)); } catch { /* optional local cooldown */ }
  };
  return { remaining: Math.max(0, Math.ceil((until - now) / 1000)), start };
}
