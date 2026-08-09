// PB-005 — MapTiler config endpoint.
// Returns the MapTiler API key to the frontend so map tiles and geocoding
// requests can be made client-side. The key is domain-restricted in the
// MapTiler dashboard (see https://cloud.maptiler.com/maps/api-keys/).
//
// The key itself is a public-facing credential (it appears in tile URLs);
// restricting it to the app's domains is the security control, not secrecy.

// MAP-CONFIG — Returns the MapTiler key (or null) so the client can degrade
// gracefully when the key is missing instead of receiving a 503. The client
// treats a null key as "maps/geocoding unavailable" and falls back to manual
// entry / OSM raster tiles.
//
// OPTIONAL Google Maps: if the owner enables Google Places via the
// googleMaps function (GOOGLE_MAPS_API_KEY, server-side only), autocomplete
// is served by Google and MapTiler remains the map-display + fallback
// provider. Required Google APIs: Places API, Geocoding API. A browser key
// (if used instead of the server proxy) must be HTTP-referrer restricted to
// app.nmood.app + staging domains.
Deno.serve(async (_req) => {
  const maptilerKey = Deno.env.get('MAPTILER_API_KEY');
  // Public, website-restricted Google Maps browser key (for the client-side
  // JS SDK). The server-only GOOGLE_MAPS_API_KEY is NEVER returned here.
  const browserKey = Deno.env.get('GOOGLE_MAPS_BROWSER_API_KEY');
  return Response.json({
    maptiler_key: maptilerKey || null,
    available: !!maptilerKey,
    browserKey: browserKey || null,
    googleMapsBrowserAvailable: !!browserKey,
  });
});