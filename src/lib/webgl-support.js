// WebGL feature detection, shared by MapLibreView (which requires WebGL) so
// map components never attempt to construct a renderer WebGL can't support,
// and never need to display a raw WebGL/provider error string to the user.
let _cached = null;

export function isWebglAvailable() {
  if (_cached !== null) return _cached;
  if (typeof document === 'undefined') { _cached = false; return _cached; }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    _cached = Boolean(gl);
  } catch {
    _cached = false;
  }
  return _cached;
}
