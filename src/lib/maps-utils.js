// Open directions to a location using the device's preferred maps application.
// On mobile this triggers the native maps app via a geo: URI; on desktop it opens
// Google Maps directions in a new tab. Falls back to a name-based search when no
// coordinates are available.
export function openDirections(coords, label) {
  const name = label || 'Location';
  if (coords && coords.length === 2 && typeof coords[0] === 'number') {
    const [lat, lng] = coords;
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener');
    return;
  }
  const q = encodeURIComponent(name);
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
}