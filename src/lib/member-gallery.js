import { useEffect, useMemo, useState } from 'react';
import { invokeSupabaseFunction, getSignedStorageUrl } from '@/api/supabaseClient';

const EMPTY_GALLERY = Object.freeze([]);
const HTTPS_URL = /^https:\/\//i;
const PRIVATE_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[A-Za-z0-9._/-]+$/i;

function signedGalleryPath(value) {
  if (typeof value !== 'string' || !HTTPS_URL.test(value.trim())) return null;
  try {
    const url = new URL(value.trim());
    const match = url.pathname.match(/\/storage\/v1\/object\/sign\/member-gallery\/(.+)$/i);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function isLegacyGalleryUrl(value) {
  return typeof value === 'string' && HTTPS_URL.test(value.trim());
}

export function isPrivateGalleryPath(value, ownerId) {
  if (typeof value !== 'string' || !PRIVATE_PATH.test(value.trim())) return false;
  return !ownerId || value.trim().startsWith(String(ownerId) + '/');
}

export async function resolveGalleryEntry(value, ownerId) {
  // Older app versions could save a short-lived signed URL. Refresh it from
  // its storage path; rendering it directly makes it fail after expiry.
  const previousSignedPath = signedGalleryPath(value);
  if (previousSignedPath && isPrivateGalleryPath(previousSignedPath, ownerId)) {
    return getSignedStorageUrl('member-gallery', previousSignedPath, 3600);
  }
  if (isLegacyGalleryUrl(value)) return value.trim();
  if (!isPrivateGalleryPath(value, ownerId)) return null;
  return getSignedStorageUrl('member-gallery', value.trim(), 3600);
}

export function useSignedMemberGallery(entries, ownerId) {
  const entriesKey = JSON.stringify(Array.isArray(entries) ? entries : EMPTY_GALLERY);
  // Callers may construct arrays during render. Depend on their contents, not
  // their identity: resolving URLs updates state and must not restart itself.
  const stableEntries = useMemo(() => JSON.parse(entriesKey), [entriesKey]);
  const key = JSON.stringify([ownerId, stableEntries]);
  const [resolved, setResolved] = useState({ key: null, urls: [] });

  useEffect(() => {
    let active = true;
    (async()=>{
      const direct=await Promise.all(stableEntries.map(entry=>resolveGalleryEntry(entry,ownerId).catch(()=>null)));
      // A viewer cannot sign another member's private gallery path directly.
      // Use the existing authenticated endpoint as the fallback on every app
      // build; it rechecks profile visibility before issuing any short-lived
      // URL and never makes gallery objects public.
      if (!ownerId || !stableEntries.some((entry,i)=>!direct[i]&&isPrivateGalleryPath(entry,ownerId))) return direct;
      try {
        const response=await invokeSupabaseFunction('main-profile-gallery',{member_id:ownerId});
        const urls=new Map((response?.rows||[]).map(row=>[row.path,row.url]));
        return direct.map((url,i)=>url||urls.get(stableEntries[i])||null);
      } catch { return direct; }
    })()
      .then((urls) => { if (active) setResolved({ key, urls }); })
      .catch(() => { if (active) setResolved({ key, urls: stableEntries.map((entry) => isLegacyGalleryUrl(entry) ? entry : null) }); });
    return () => { active = false; };
  }, [stableEntries, ownerId, key]);

  // Keep the unresolved projection stable too: profile effects depend on this
  // array and must not reset state repeatedly before the signing promise settles.
  const pendingUrls = useMemo(() => stableEntries.map(entry => isLegacyGalleryUrl(entry) ? entry : null), [stableEntries]);
  return resolved.key === key ? resolved.urls : pendingUrls;
}
