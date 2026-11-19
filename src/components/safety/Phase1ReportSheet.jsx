import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Send } from 'lucide-react';
import { callSupabaseRpc } from '@/api/supabaseClient';

export const SAFETY_REPORT_CATEGORIES = [
  ['harassment', 'Harassment'], ['threats_violence', 'Threats or violence'],
  ['scam_fraud', 'Scam or fraud'], ['impersonation', 'Impersonation'],
  ['sexual_solicitation', 'Sexual solicitation'],
  ['non_consensual_intimate_content', 'Non-consensual intimate content'],
  ['child_safety_concern', 'Child-safety concern'],
  ['illegal_goods_services', 'Illegal goods or services'], ['spam', 'Spam'], ['other', 'Other'],
];

export default function Phase1ReportSheet({ open, onOpenChange, target }) {
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  useEffect(() => { if (!open) { setCategory(''); setDetails(''); setAlsoBlock(false); setState('idle'); setError(''); } }, [open]);
  const submit = async () => {
    setState('saving'); setError('');
    try {
      await callSupabaseRpc('nmood_submit_safety_report', { p_target_type: (target?.type || 'member') === 'member' ? 'profile' : target?.type, p_target_id: target?.id, p_category: category, p_details: details, p_evidence: target?.evidence || {} });
      if (alsoBlock && (target?.type || 'member') === 'member') await callSupabaseRpc('nmood_block_member', { p_member_id: target?.reportedMemberId || target?.id });
      setState('done');
    } catch { setState('idle'); setError('We could not submit this report. Check your connection and try again.'); }
  };
  return <BottomSheet open={open} onOpenChange={onOpenChange} title={target?.type === 'message' ? 'Report message' : 'Report profile'} description="Reports are private and reviewed by the Nmood safety team.">
    {state === 'done' ? <div className="py-10 text-center"><Check className="mx-auto mb-3 h-9 w-9 text-success"/><h3 className="font-semibold">Report received</h3><p className="mt-1 text-sm text-muted-foreground">Thank you. We’ll review it privately. If anyone is in immediate danger, contact local emergency services.</p><Button className="mt-5" onClick={() => onOpenChange(false)}>Done</Button></div> : <div className="space-y-3 pb-3">
      {SAFETY_REPORT_CATEGORIES.map(([value,label]) => <button key={value} type="button" onClick={() => setCategory(value)} className={`w-full rounded-xl border p-3 text-start text-sm ${category===value?'border-primary bg-primary/5':'border-border'}`}>{label}</button>)}
      <textarea value={details} onChange={(e)=>setDetails(e.target.value)} maxLength={4000} rows={3} placeholder="Tell us what happened (optional)" className="w-full rounded-xl border bg-muted/40 p-3 text-sm" />
      {target?.type === 'message' && <p className="text-xs text-muted-foreground">Only the reported message reference and its attachment reference, if any, are preserved as evidence.</p>}
      {(target?.type || 'member') === 'member' && <label className="flex gap-2 text-sm"><input type="checkbox" checked={alsoBlock} onChange={(e)=>setAlsoBlock(e.target.checked)}/> Also block this member</label>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full gap-2" disabled={!category || state==='saving'} onClick={submit}>{state==='saving'?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} Submit report</Button>
      <p className="text-center text-xs text-muted-foreground"><Link to="/community-guidelines" className="underline">Community Guidelines</Link> · <Link to="/safety-center" className="underline">Safety &amp; Help</Link></p>
    </div>}
  </BottomSheet>;
}
