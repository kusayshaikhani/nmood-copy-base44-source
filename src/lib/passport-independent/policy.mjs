export const PROJECT = 'vudvrofhxwopgbldunky';
export const RELEASE_APPROVED = false;
export function acceptResponse(active, response) {
 return !!active && !!response && active.actorId === response.actorId
  && active.epoch === response.epoch && active.destination === response.destination
  && active.entitlementVersion === response.entitlementVersion && response.ok === true;
}
