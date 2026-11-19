import React, { useCallback, useEffect, useState } from 'react';
import AdminListPage from '@/components/admin/AdminListPage';
import BottomSheet from '@/components/shared/BottomSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { adminListSupportMessages, adminListSupportThreads, adminReplySupport, adminSetSupportStatus } from '@/lib/support-conversation';

export default function AdminSupportConversations() {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try { setThreads(await adminListSupportThreads()); setError(''); }
    catch { setError('Support conversations could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  const refreshMessages = useCallback(async () => {
    if (selected?.id) setMessages(await adminListSupportMessages(selected.id));
  }, [selected?.id]);

  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 45000); return () => window.clearInterval(timer); }, [refresh]);
  useEffect(() => { refreshMessages().catch(() => {}); const timer = window.setInterval(() => refreshMessages().catch(() => {}), 45000); return () => window.clearInterval(timer); }, [refreshMessages]);

  const send = async () => {
    if (!selected || !reply.trim()) return;
    await adminReplySupport(selected.id, reply);
    setReply(''); await refreshMessages(); await refresh();
  };
  const setStatus = async (status) => { await adminSetSupportStatus(selected.id, status); setSelected({ ...selected, status }); await refresh(); };

  const columns = [
    { key: 'member_name', label: 'Member' }, { key: 'subject', label: 'Subject' },
    { key: 'unread_count', label: 'Unread', render: (item) => item.unread_count || 0 },
    { key: 'status', label: 'Status', render: (item) => <Badge>{item.status}</Badge> },
    { key: 'open', label: '', render: (item) => <Button size="sm" variant="outline" onClick={() => setSelected(item)}>Open</Button> },
  ];
  return <>
    {error ? <p role="alert" className="mb-3 text-sm text-destructive">{error}</p> : null}
    <AdminListPage title="Support" description="Private member support conversations" columns={columns} data={threads} loading={loading} searchKeys={['member_name','subject']} />
    <BottomSheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title="Support conversation" footerLabel="Send reply" onFooterAction={send}>
      <div className="space-y-3 pb-4">
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-muted/30 p-3">
          {messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-xl p-2.5 text-sm ${message.author_role === 'support' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-card border'}`}>{message.body}</div>)}
        </div>
        <Textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={2000} placeholder="Reply as Nmood Support" />
        <div className="flex gap-2"><Button variant="outline" onClick={() => setStatus('waiting')}>Waiting</Button><Button variant="outline" onClick={() => setStatus('resolved')}>Resolve</Button></div>
      </div>
    </BottomSheet>
  </>;
}
