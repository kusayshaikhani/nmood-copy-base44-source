import React, { useEffect, useRef, useState } from 'react';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const keyOf = item => [item.source, item.kind, item.id].join(':');
export default function LegacyContentConfirmation({ region, onChanged }) {
 const { user } = useAuth();
 const generation = useRef(0);
 const [rows, setRows] = useState([]);
 const [selected, setSelected] = useState(new Set());
 const [cursor, setCursor] = useState(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [attempt, setAttempt] = useState(0);
 useEffect(() => {
  generation.current++;
  let current = true;
  setRows([]); setSelected(new Set()); setCursor(null); setError(''); setBusy(true);
  callSupabaseRpc('nmood_list_my_unconfirmed_passport_content', { p_after: null }, { expectedUserId: user?.id })
   .then(result => { if (!result || !Array.isArray(result.items)) throw new Error('Unconfirmed'); if (current) { setRows(result.items); setCursor(result.next_cursor); } })
   .catch(() => { if (current) setError('Your content could not be loaded. Please retry.'); })
   .finally(() => { if (current) setBusy(false); });
  return () => { current = false; generation.current++; };
 }, [user?.id, region.scope_revision, attempt]);
 async function more() {
  const own = generation.current;
  setBusy(true);setError('');
  try {
   const page = await callSupabaseRpc('nmood_list_my_unconfirmed_passport_content', { p_after: cursor }, { expectedUserId: user?.id });
   if (own !== generation.current) return;
   if (!Array.isArray(page?.items)) throw new Error('Unconfirmed');
   setRows(old => [...new Map([...old, ...page.items].map(item => [keyOf(item), item])).values()]);setCursor(page.next_cursor);
  } catch { if (own === generation.current) setError('More content could not be loaded. Please retry.'); }
  finally { if (own === generation.current) setBusy(false); }
 }
 async function confirm() {
  const own = generation.current;
  const items = rows.filter(row => selected.has(keyOf(row))).map(({source,kind,id}) => ({source,kind,id}));
  if (!items.length || items.length > 50) return;
  setBusy(true);setError('');
  try {
   const result = await callSupabaseRpc('nmood_confirm_my_passport_content_batch', {p_items:items,p_expected_revision:region.scope_revision}, {expectedUserId:user?.id});
   if (own !== generation.current) return;
   if (result?.confirmed_count !== items.length) throw new Error('Unconfirmed');
   setRows(old => old.filter(row => !selected.has(keyOf(row))));setSelected(new Set());onChanged?.();
  } catch { if (own === generation.current) setError('Content was not confirmed. Your selections are still here. Please retry.'); }
  finally { if (own === generation.current) setBusy(false); }
 }
 return <section className="mt-6 space-y-3" aria-label="Confirm earlier content">
  <h3 className="font-semibold">Confirm earlier content</h3>
  <p>Select the items you want to share from your confirmed Home country. Existing privacy settings still apply. Unselected items stay outside discovery.</p>
  {busy && <p role="status">Loading…</p>}
  {!busy && !error && !rows.length && <p>No content needs confirmation.</p>}
  <fieldset disabled={busy}>{rows.map(item => <label className="flex min-h-11 items-center gap-3" key={keyOf(item)}>
   <input type="checkbox" checked={selected.has(keyOf(item))} onChange={event => setSelected(old => { const next=new Set(old); if (event.target.checked) next.add(keyOf(item)); else next.delete(keyOf(item)); return next; })}/>
   {item.title} · {item.kind}
  </label>)}</fieldset>
  {cursor && <button disabled={busy} onClick={more}>Load more</button>}
  <button disabled={busy || !selected.size || selected.size>50} onClick={confirm}>Confirm selected content</button>
  {selected.size>50 && <p role="alert">Choose up to 50 items at a time.</p>}
  {error && <p role="alert">{error} {!rows.length && <button onClick={()=>setAttempt(n=>n+1)}>Retry loading</button>}</p>}
 </section>;
}
