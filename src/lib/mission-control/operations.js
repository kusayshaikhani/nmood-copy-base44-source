// Only an explicit server-checked role grants access. Never use a dev-owner override.
export const isOperationsAdmin = user => ['admin', 'founder'].includes(user?.role);
export const deletionConfirmation = id => `DELETE ${id}`;
export const canConfirmDeletion = ({ id, typed, warned, reason, plan }) => Boolean(id && typed === deletionConfirmation(id) && warned && reason?.trim() && plan?.member_id === id && plan.execution_allowed === true && typeof plan.fingerprint === 'string');
export const EMPTY_AUDIENCE = { country: '', city: '', account_status: 'active', premium: 'any', onboarding: 'any', gender: '', age_min: '', age_max: '', birthday_month: '', activity: 'any', include_platform_admins: false, excluded_ids: [] };
export function broadcastInput({ title, body, filters, channel = 'in_app' }) {
 if (channel !== 'in_app') throw Error('Only in-app announcements are implemented.');
 if (!title?.trim() || title.trim().length > 120 || !body?.trim() || body.trim().length > 2000) throw Error('Enter a title (up to 120 characters) and message (up to 2,000 characters).');
 if (filters.city && !filters.country) throw Error('Select a country before a city.');
 if (!['any', 'premium', 'free'].includes(filters.premium) || !['any', 'complete', 'incomplete'].includes(filters.onboarding)) throw Error('Invalid audience.');
 if (!['active', 'paused', 'hidden', 'deleted', 'suspended', 'banned'].includes(filters.account_status)) throw Error('Choose an account status.');
 if (filters.excluded_ids.length > 500 || filters.excluded_ids.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) throw Error('Exclusions must be member UUIDs (maximum 500).');

 if (!['any','active_30d','inactive_30d'].includes(filters.activity || 'any') || String(filters.gender || '').length > 80) throw Error('Invalid audience filter.');
 for (const [key,max] of [['age_min',120],['age_max',120],['birthday_month',12]]) {
  const v=filters[key];if(v!==undefined&&v!==''&&(!/^\d+$/.test(String(v))||Number(v)<(key==='birthday_month'?1:18)||Number(v)>max))throw Error('Invalid age or birthday filter.');
 }
 if(filters.age_min!==''&&filters.age_max!==''&&Number(filters.age_min)>Number(filters.age_max))throw Error('Invalid age range.');
 return { title: title.trim(), body: body.trim(), channel, filters: { ...filters, excluded_ids: [...new Set(filters.excluded_ids)].sort() } };
}
export const broadcastFingerprint = input => JSON.stringify(broadcastInput(input));

export const canDeleteReviewedMember = (id, plan) => Boolean(id && plan?.member_id === id && plan.execution_allowed === true && (!plan.blockers || plan.blockers.length === 0) && typeof plan.fingerprint === 'string' && plan.fingerprint.length > 0);
export function deletionBlockMessage(plan) {
 const blockers=Array.isArray(plan?.blockers)?plan.blockers:[];
 if(blockers.some(b=>/^PRESERVE_DEPENDENT:|SHARED_/.test(b)))return 'This member has shared records that must be preserved. Deletion needs a dependency repair before it can continue.';
 if(blockers.some(b=>/^AUTH_DEPENDENCY:|OWNERSHIP_SCHEMA:|PRIMARY_KEY_REQUIRED:|UNREVIEWED_DELETE_TRIGGER:/.test(b)))return 'A server account-dependency check is blocking deletion. No data was removed.';
 if(blockers.some(b=>/OWNERSHIP_UNCERTAIN/.test(b)))return 'File ownership could not be confirmed. No files or account data were removed.';
 return 'This account cannot currently be deleted. No data was removed.';
}

export function deletionFailureMessage(category) {
 const reasons={PLAN_CHANGED_REVIEW_REQUIRED:'This member’s data changed since the preview. Check again and review the updated plan before confirming.',SERVER_PERMISSION_BLOCKED:'A server permission is blocking cleanup. An administrator must repair the backend permission before deletion.',SHARED_DEPENDENCY_BLOCKED:'A shared-data dependency prevents safe deletion. Other members’ data has been preserved.',OWNED_DATA_REMAINS:'The server could not safely remove all owned data. Cleanup needs a backend repair.'};
 return (reasons[category]||'The deletion transaction failed. A backend check is required before retrying.')+' No database changes were kept.';
}
