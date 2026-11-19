import {useEffect, useRef, useState} from 'react';
import {useModeratorObservationAccess} from '@/hooks/useModeratorObservationAccess';
import {callSupabaseRpc} from '@/api/supabaseClient';
import {downloadObservationAttachment} from '@/lib/moderator-observation-attachment';
import {withTimeout} from '@/lib/bounded-operation';

/** Internal rehearsal entry. Local role/subscription flags never authorize observation. */
export default function ModeratorObservation(props) {
  const {viewerId, allowed} = useModeratorObservationAccess();
  if (!allowed) return null;
  if (!props.spaceId) return <SelectObservationSpace key={viewerId} viewerId={viewerId} />;
  if (!['circle', 'experience'].includes(props.scope) || !['typed', 'compatibility'].includes(props.source)) return null;
  return <ObservationPanel key={[viewerId, props.scope, props.source, props.spaceId].join(':')} {...props} viewerId={viewerId} />;
}
function SelectObservationSpace({viewerId}) {
  const [scope, setScope] = useState('circle');
  const [source, setSource] = useState('typed');
  const [reference, setReference] = useState('');
  const [selected, setSelected] = useState(null);
  if (selected) return <ObservationPanel {...selected} viewerId={viewerId} onEnd={() => setSelected(null)} />;
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference.trim());
  return <form className="space-y-4 p-4" onSubmit={event => {event.preventDefault(); if(valid) setSelected({scope,source,spaceId:reference.trim()});}}>
    <h1>Moderator access</h1>
    <p>Select the space identified in your moderation case. No member or direct-message search is available here.</p>
    <label className="block">Space type<select className="block min-h-11" value={scope} onChange={e => setScope(e.target.value)}><option value="circle">Circle</option><option value="experience">Experience</option></select></label>
    <label className="block">Record source<select className="block min-h-11" value={source} onChange={e => setSource(e.target.value)}><option value="typed">Current</option><option value="compatibility">Legacy compatibility</option></select></label>
    <label className="block">Space reference<input className="block min-h-11 w-full rounded border" value={reference} onChange={e => setReference(e.target.value)} autoComplete="off" spellCheck={false} /></label>
    <button className="min-h-11" disabled={!valid}>Select space</button>
  </form>;
}

function ObservationPanel({scope, source, spaceId, viewerId, onEnd}) {
  const [category, setCategory] = useState('');
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const pending = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = async (operation) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { await operation(); }
    catch { if (alive.current) { setAttachment(null); setData(null); setError('Moderator access is unavailable. Retry or leave this screen.'); } }
    finally { pending.current = false; if (alive.current) setBusy(false); }
  };
  useEffect(() => {
    if (!data?.expires_at) return;
    const timeout = setTimeout(() => { setAttachment(null); setData(null); setError('This review session has expired. Exit and start a new review.'); }, Math.max(0, Math.min(1800000, Date.parse(data.expires_at) - Date.now())));
    return () => clearTimeout(timeout);
  }, [data?.expires_at]);
  useEffect(() => {
    if (!attachment) return;
    const timer = setTimeout(() => setAttachment(null), attachment.ttlMs);
    return () => { clearTimeout(timer); URL.revokeObjectURL(attachment.url); };
  }, [attachment]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { setData(null); setAttachment(null); } };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  const rpc = (name, params) => withTimeout(signal => callSupabaseRpc(name, params, {signal, expectedUserId: viewerId}));
  const read = async (id, cursor = null) => {
    const result = await rpc('nmood_read_observation', {p_session: id, p_cursor: cursor});
    if (alive.current && !document.hidden) setData(result);
  };
  return <section aria-label="Moderator access" className="space-y-3 rounded-xl border p-4">
    <h2 className="font-semibold">Moderator access</h2>
    <p>Read-only safety review of this space. You are not joining as a participant. Entry and exit are audited.</p>
    {!session && <>
      <label>Review category<select className="block min-h-11" value={category} onChange={e => setCategory(e.target.value)}>
        <option value="">Choose a category</option>
        <option value="safety_report">Safety report</option>
        <option value="behavior_review">Behavior review</option>
        <option value="community_compliance">Community compliance</option>
      </select></label>
      <button className="min-h-11" disabled={busy || !category} onClick={() => run(async () => {
        const id = await rpc('nmood_begin_observation', {p_scope: scope, p_source: source, p_space: spaceId, p_category: category});
        if (alive.current) setSession(id);
        await read(id);
      })}>Enter Moderator access</button>
    </>}
    {session && <>
      <button className="min-h-11" disabled={busy} onClick={() => run(() => read(session))}>Refresh review</button>
      <button className="min-h-11" disabled={busy} onClick={() => run(async () => {
        setAttachment(null); setData(null);
        await rpc('nmood_end_observation', {p_session: session});
        if (alive.current) { setSession(null); onEnd?.(); }
      })}>Exit Moderator access</button>
    </>}
    {busy && <p role="status">Loading review…</p>}
    {error && <p role="alert">{error}</p>}
    {attachment && <section aria-label="Authorized attachment" className="rounded-lg border p-3">
      <button className="min-h-11" onClick={() => setAttachment(null)}>Close attachment</button>
      {attachment.type.startsWith('image/') ? <img src={attachment.url} alt="Moderated attachment" className="max-h-96 max-w-full" />
        : attachment.type.startsWith('video/') ? <video src={attachment.url} controls className="max-h-96 max-w-full" />
        : attachment.type.startsWith('audio/') ? <audio src={attachment.url} controls />
        : <a className="inline-flex min-h-11 items-center" href={attachment.url} download="moderated-attachment">Open authorized file</a>}
      <p>This temporary viewer closes automatically. Do not redistribute reviewed content.</p>
    </section>}
    {data && <div><h3>{data.space?.title}</h3><p>{data.space?.description}</p>
      <p>Read-only history, 50 messages per page. Sender names and message attachments are available only inside this space.</p>
      {data.messages?.map(message => <div key={message.id} className="whitespace-pre-wrap break-words">
        <strong>{message.sender_name || 'Name unavailable'}</strong><p>{message.text}</p>
        {message.has_attachment && <button className="min-h-11" disabled={busy} onClick={() => run(async () => {
          const result = await downloadObservationAttachment(session, message.id);
          if (!alive.current || document.hidden) return;
          setAttachment({url:URL.createObjectURL(result.blob),type:result.blob.type,ttlMs:result.ttlMs});
        })}>View attachment</button>}
      </div>)}
      {data.next_cursor && <button className="min-h-11" disabled={busy} onClick={() => run(() => read(session, data.next_cursor))}>Older messages</button>}
    </div>}
  </section>;
}
