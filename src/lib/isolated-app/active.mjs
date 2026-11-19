import {createCustomerGroupChat} from '../isolated-customer/group-chat.mjs';
import {createIsolatedMediaAdapter} from './media.mjs';
import {createIsolatedRecordAdapter} from './records.mjs';
import {createIsolatedMessageAdapter} from './messages.mjs';
// Build-time only. The ordinary Nmood bundle never selects this backend.
export const ISOLATED_APP_BUILD = typeof __NMOOD_ISOLATED_APP_TEST__ !== 'undefined' && __NMOOD_ISOLATED_APP_TEST__ === true;
let current;
export function bindIsolatedAppAdapters(session) {
  if (!ISOLATED_APP_BUILD) throw Error('ISOLATED_BUILD_REQUIRED');
  if(typeof session?.appClient !== 'function') throw Error('ISOLATED_SESSION_REQUIRED');
  const client = session.appClient();
  const media=createIsolatedMediaAdapter(client);
  const binding = {groupChat:createCustomerGroupChat(client),media,records: createIsolatedRecordAdapter(client,{media}), messages: createIsolatedMessageAdapter(client), client};
  current = binding;
  return () => { media.dispose(); if(current === binding) current = undefined; };
}
export function isolatedAppAdapters() {
  if (!ISOLATED_APP_BUILD || !current) throw Error('ISOLATED_SESSION_REQUIRED');
  return current;
}
export async function isolatedAdminDelete(input) {
  const value = await isolatedAppAdapters().client.adminDelete(input);
  if (value?.status === 'COMPLETE') return {ok:true, ...value};
  if (value?.status === 'PENDING' || value?.status === 'CLEANUP_PENDING') return {ok:false, ...value, status:'CLEANUP_PENDING'};
  throw Error('ISOLATED_RESPONSE');
}
