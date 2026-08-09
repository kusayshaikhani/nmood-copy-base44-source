import { base44 } from '@/api/base44Client';

/** RRPH-002 — Update a certification item status. */
export async function updateCert(entity, id, patch) {
  const res = await base44.functions.invoke('launchCenter', { mode: 'updateCert', entity, id, patch });
  return res?.data;
}