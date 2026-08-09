import React, { useEffect, useState, useCallback } from 'react';
import { Search, Pencil, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import {
  listMemberNotes, createMemberNote, updateMemberNote, deleteMemberNote,
} from '@/lib/admin-actions';
import { toast } from '@/components/ui/use-toast';
import { formatRelative } from '@/lib/member-directory';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * FM-003 — Private, timestamped, editable, searchable admin notes.
 * Notes are stored in the MemberNote entity and are never exposed to members.
 */
export default function MCMemberNotes({ member }) {
  const { t } = useLocalization();
  const confirm = useAdminConfirm();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const load = useCallback(() => {
    if (!member?.id) return;
    let active = true;
    setLoading(true);
    listMemberNotes(member.id)
      .then((n) => { if (active) setNotes(n); })
      .catch(() => { if (active) setNotes([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [member?.id]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const add = async () => {
    if (!content.trim()) return;
    try {
      await createMemberNote(member.id, member.created_by_id, content.trim());
      setContent('');
      toast({ title: 'Note added' });
      load();
    } catch {
      toast({ title: 'Failed to add note', variant: 'destructive' });
    }
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      await updateMemberNote(id, editText.trim());
      setEditingId(null);
      setEditText('');
      toast({ title: 'Note updated' });
      load();
    } catch {
      toast({ title: 'Failed to update note', variant: 'destructive' });
    }
  };

  const remove = async (id) => {
    const ok = await confirm({ title: 'Delete this note?', confirmLabel: 'Delete', variant: 'destructive' });
    if (!ok) return;
    try {
      await deleteMemberNote(id);
      toast({ title: 'Note deleted' });
      load();
    } catch {
      toast({ title: 'Failed to delete note', variant: 'destructive' });
    }
  };

  const filtered = search ? notes.filter((n) => (n.body || '').toLowerCase().includes(search.toLowerCase())) : notes;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{t('mission.internal_notes')}</h3>
        <span className="text-[10px] text-muted-foreground">{t('mission.private_admin_only')}</span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('mission.search_notes')}
          className="w-full h-9 pl-10 pr-4 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('mission.add_an_internal_note_about')}
        className="mb-2 min-h-[70px] resize-none"
      />
      <Button size="sm" className="w-full gap-2" onClick={add} disabled={!content.trim()}>
        <Send className="w-3.5 h-3.5" /> {t('mission.add_note_2')}
      </Button>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('mission.loading_notes')}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">{t('mission.no_notes_yet')}</p>
        ) : (
          filtered.map((n) => (
            <div key={n.id} className="rounded-lg bg-muted/30 p-3">
              {editingId === n.id ? (
                <div className="space-y-2">
                  <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[60px] resize-none" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(n.id)}>{t('mission.save')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t('admin.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap break-words">{n.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-muted-foreground">
                      {n.author || 'Admin'} · {formatRelative(n.created_date)}
                    </p>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingId(n.id); setEditText(n.body); }} className="p-1 rounded hover:bg-muted" aria-label={t('mission.edit_note')}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => remove(n.id)} className="p-1 rounded hover:bg-muted" aria-label={t('mission.delete_note')}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}