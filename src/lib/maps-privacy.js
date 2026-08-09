// MAP-PRIVACY — Location privacy helpers.
// Public records (Experiences/Circles discovery, member profiles) must never
// expose precise live coordinates to other members. Hosts see precise coords
// for their own listings; admins see precise coords; everyone else sees an
// approximate location rounded to ~1km so members can find the area without
// being guided to a person's doorstep or live position.

/**
 * Round coordinates to a decimal precision.
 * 2 decimals ≈ 1.1km, 1 decimal ≈ 11km.
 */
export function approximateCoords(lat, lng, precision = 2) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const f = Math.pow(10, precision);
  return [Math.round(lat * f) / f, Math.round(lng * f) / f];
}

/**
 * True when a viewer should see precise coordinates (own listing, admin, or a
 * private/admin context). Otherwise public viewers get approximate coords.
 */
export function shouldShowPreciseCoords({ isOwner = false, isAdmin = false, isPrivate = false } = {}) {
  return isOwner || isAdmin || isPrivate;
}

/**
 * Returns coordinates safe for public display: precise for owner/admin,
 * approximate (~1km) otherwise. Returns null when no coords.
 */
export function publicCoords(lat, lng, { isOwner = false, isAdmin = false } = {}) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (shouldShowPreciseCoords({ isOwner, isAdmin })) return [lat, lng];
  return approximateCoords(lat, lng, 2);
}