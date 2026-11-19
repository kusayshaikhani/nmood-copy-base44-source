// A public writer response is a partial owner update, not a new private profile.
// Never carry owner-only fields across identities; explicit nulls still clear.
export function mergeOwnerMember(previous, updated) {
 return previous?.id && previous.id===updated?.id ? {...previous,...updated} : updated;
}
