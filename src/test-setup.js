import '@testing-library/jest-dom/vitest';

// Vitest setup — this Node/vitest/jsdom combination leaves window.localStorage
// undefined (Node's own experimental global `localStorage` shadows jsdom's),
// which breaks any module that reads localStorage at import time (e.g.
// src/lib/app-params.js). Install a tiny in-memory stub once, globally.
if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
  const store = new Map();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
      key: (i) => Array.from(store.keys())[i] ?? null,
      get length() { return store.size; },
    },
  });
}

// jsdom has no ResizeObserver; Radix (Slider, Select, …) requires it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
