// Existing authorized public projections only. Private conversation content and
// account/editor drafts are not regional discovery caches.
const regionalRoots = new Set([
 'discovery', 'nmoodPosts', 'nmoodJoinState', 'nmoodDirectMessageAccess',
 'memberProfile', 'memberIndicators', 'memberNames', 'memberName',
 'accountActivity', 'outgoingRequestRecipient', 'myExperiences', 'notifications',
]);
export const isRegionalQuery = query => regionalRoots.has(query.queryKey?.[0]);
