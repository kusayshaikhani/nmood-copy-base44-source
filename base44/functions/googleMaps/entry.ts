// MAP-GOOGLE — Google Maps server-side proxy (Places API (New)).
//
// Migrated from legacy maps.googleapis.com Places endpoints to the
// Places API (New) at places.googleapis.com/v1. The response contract is
// preserved exactly so existing consumers (place-search.js) need no changes.
//
// Endpoints:
//   - Autocomplete (New): POST https://places.googleapis.com/v1/places:autocomplete
//   - Place Details (New): GET  https://places.googleapis.com/v1/places/{placeId}
//
// Auth: X-Goog-Api-Key header (never in the URL/query). The server-side
// GOOGLE_MAPS_API_KEY is never returned to the browser; no HTTP-referrer
// restriction is required for this server-proxy path.
//
// Required Google APIs (enable in Google Cloud Console → APIs & Services):
//   - Places API (New) — required for this proxy (Autocomplete + Place Details)
//   - Geocoding API — optional, for address→coords fallback (not used here)
//
// When GOOGLE_MAPS_API_KEY is absent, every action returns { available: false }
// so the client transparently falls back to the existing MapTiler integration.

function getKey() {
  const k = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (typeof k !== 'string') return null;
  const s = k.trim();
  if (!s || s.length > 200) return null;
  // Opaque-token validation — no schemes/whitespace/control chars so a tampered
  // secret can never redirect an outbound fetch to an internal host.
  if (/[\s\r\n\t\u0000-\u001f]/.test(s)) return null;
  if (/https?:\/\//i.test(s)) return null;
  return s;
}

// Places API (New) Autocomplete (POST) — returns suggestions array.
async function autocompleteNew(key: string, input: string, lat?: number, lng?: number, radius?: number) {
  const body: any = {
    input,
    languageCode: 'en',
  };
  if (typeof lat === 'number' && typeof lng === 'number') {
    body.locationBias = {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radius || 50000, // meters
      },
    };
  }
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  // Places API (New) error shape: { error: { code, message, status } }
  if (!res.ok || data.error) {
    const status = data?.error?.status || data?.error?.code || `HTTP_${res.status}`;
    // Pass Google's sanitized error message/status through for client
    // diagnostics. Never include headers, URLs, or the key value.
    const gMsg = typeof data?.error?.message === 'string' ? data.error.message : status;
    return { ok: false, status, error: gMsg, google_error_message: gMsg, google_error_status: status };
  }
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  const predictions = suggestions
    .map((s: any) => {
      const p = s?.placePrediction;
      if (!p || !p.placeId) return null;
      const fullText = p.text?.text || p.structuredForm?.mainPrompt?.text || '';
      const mainText = p.structuredForm?.mainPrompt?.text || fullText;
      return {
        place_id: p.placeId,
        text: mainText,
        place_name: fullText,
      };
    })
    .filter(Boolean);
  return { ok: true, predictions };
}

// Places API (New) Place Details (GET) — returns the existing result shape.
async function placeDetailsNew(key: string, placeId: string) {
  // Field mask: only the fields we map back to the existing contract.
  const fieldMask = 'displayName,formattedAddress,addressComponents,location';
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': fieldMask,
      'Accept': 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    const status = data?.error?.status || data?.error?.code || `HTTP_${res.status}`;
    return { ok: false, status, error: data?.error?.message || status };
  }
  if (!data.location || typeof data.location.latitude !== 'number') {
    return { ok: false, status: 'NO_LOCATION' };
  }
  const comps = Array.isArray(data.addressComponents) ? data.addressComponents : [];
  const get = (type: string) =>
    comps.find((c: any) => Array.isArray(c.types) && c.types.includes(type))?.longText || '';
  return {
    ok: true,
    result: {
      coordinates: [data.location.latitude, data.location.longitude], // [lat, lng]
      venueName: data.displayName?.text || '',
      address: data.formattedAddress || '',
      city: get('locality') || get('administrative_area_level_2') || get('postal_town'),
      country: get('country'),
      area: get('administrative_area_level_1'),
    },
  };
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, input, place_id, lat, lng, radius } = body;
    const key = getKey();

    if (!key) {
      return Response.json({ available: false });
    }

    if (action === 'autocomplete') {
      if (!input || typeof input !== 'string' || input.trim().length < 2) {
        return Response.json({ available: true, predictions: [] });
      }
      const r = await autocompleteNew(key, input.trim(), lat, lng, radius);
      if (!r.ok) {
        return Response.json({
          available: true,
          predictions: [],
          error: r.status,
          google_error_message: r.google_error_message,
          google_error_status: r.google_error_status,
        });
      }
      return Response.json({ available: true, predictions: r.predictions });
    }

    if (action === 'placeDetails') {
      if (!place_id || typeof place_id !== 'string') {
        return Response.json({ available: true, result: null });
      }
      const r = await placeDetailsNew(key, place_id);
      if (!r.ok) {
        return Response.json({ available: true, result: null, error: r.status });
      }
      return Response.json({ available: true, result: r.result });
    }

    return Response.json({ available: true, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ available: false, error: error.message }, { status: 500 });
  }
});