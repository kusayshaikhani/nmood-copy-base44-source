// Suppress historical acknowledgements locally without deleting stored notifications.
export function suppressSelfActionNotifications(rows){
 return rows.filter(row=>!(row.actor_id && String(row.actor_id)===String(row.member_id) && /^(connection_|circle_request_|experience_request_|nmood_request_)/.test(row.event_type||'')));
}
