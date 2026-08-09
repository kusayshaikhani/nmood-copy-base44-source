// F-003 Performance monitoring — records timing for key flows.
import { base44 } from '@/api/base44Client';
import { APP_VERSION } from './system-config';

export function startTimer(metric_name, screen) {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return {
    end(metadata = {}) {
      const duration_ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
      track(metric_name, duration_ms, screen, metadata);
      return duration_ms;
    },
  };
}

export function track(metric_name, duration_ms, screen, metadata = {}) {
  try {
    base44.functions.invoke('systemOps', {
      mode: 'logPerformance',
      metric_name,
      duration_ms,
      screen: screen || (typeof window !== 'undefined' ? window.location?.pathname : ''),
      metadata,
    }).catch(() => {});
  } catch {
    /* swallow */
  }
}

// Record app startup from navigation timing.
export function recordAppStartup() {
  try {
    const nav = performance?.getEntriesByType?.('navigation')?.[0];
    if (nav) {
      track('app_startup', Math.round(nav.loadEventEnd - nav.startTime), 'startup', { domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime) });
    }
  } catch {
    /* swallow */
  }
}

// Record page (screen) load latency.
export function recordPageLoad(screen) {
  try {
    const nav = performance?.getEntriesByType?.('navigation')?.[0];
    const duration = nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0;
    if (duration > 0) track('home_load', duration, screen || 'home', {});
  } catch {
    /* swallow */
  }
}

// RM-003 Memory usage (where the browser exposes performance.memory).
export function recordMemoryUsage() {
  try {
    const mem = performance?.memory;
    if (!mem) return;
    track('memory_usage', 0, 'memory', {
      used_mb: Math.round(mem.usedJSHeapSize / 1048576),
      limit_mb: Math.round(mem.jsHeapSizeLimit / 1048576),
    });
  } catch { /* swallow */ }
}

// RM-003 Failed request counter.
export function recordFailedRequest(screen, detail = '') {
  try {
    track('failed_request', 0, screen || 'unknown', { detail });
  } catch { /* swallow */ }
}

// RM-003 Cache hit ratio helper.
export function recordCacheHit(screen, hit) {
  try {
    track('cache_hit', 0, screen || 'cache', { hit: !!hit });
  } catch { /* swallow */ }
}