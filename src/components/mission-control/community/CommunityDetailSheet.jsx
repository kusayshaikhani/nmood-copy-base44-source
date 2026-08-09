import React, { useEffect, useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, EyeOff, Archive, Trash2, Pencil, UserCog, RefreshCw, RotateCcw, XCircle, Send } from 'lucide-react';
import { MCActivityTimeline } from '@/components/mission-control/ui';
import SmartImage from '@/components/shared/SmartImage';
import { listCommunityNotes, createCommunityNote, deleteCommunityNote, listActivity } from '@/lib/admin-actions';
import { activeReports } from '@/lib/community-metrics';
import { useToast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CommunityDetailSheet({ open, onOpenChange, item, type, onEdit, onAction }) {
  const { t } = useLocalization();
  const [notes, setNotes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !item) return;
    listCommunityNotes(type, item.id).then(setNotes).catch(() => setNotes([]));
    listActivity(type === 'experience' ? 'Experience' : 'Circle', item.id).then(setActivity).catch(() => setActivity([]));
    setNoteText('');
  }, [open, item, type]);

  if (!item) return null;
  const title = type === 'experience' ? item.title : item.name;
  const reports = activeReports(item._allReports || [], type, item.id);

  const submitNote = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    try {
      await createCommunityNote(type, item.id, noteText.trim());
      setNoteText('');
      setNotes(await listCommunityNotes(type, item.id));
      toast({ title: 'Internal note added' });
    } catch { toast({ title: 'Failed to add note', variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const removeNote = async (id) => {
    await deleteCommunityNote(id);
    setNotes(await listCommunityNotes(type, item.id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {(item.cover_image || item.cover_photo) ? <SmartImage src={item.cover_image || item.cover_photo} alt={title} rounded="rounded-lg" blur={false} /> : null}
            </div>
            <span className="truncate">{title}</span>
          </SheetTitle>
          <SheetDescription className="sr-only">{type} details and administrative actions</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.overview')}</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-xs text-muted-foreground">{type === 'experience' ? 'Host' : 'Owner'}</dt><dd>{item.host_name || '—'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t('mission.location')}</dt><dd>{item.location || '—'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t('mission.category')}</dt><dd>{item.category || '—'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t('mission.visibility')}</dt><dd className="capitalize">{item.visibility || 'public'}</dd></div>
              {type === 'experience'
                ? <><div><dt className="text-xs text-muted-foreground">{t('mission.date')}</dt><dd>{item.date || '—'}</dd></div>
                   <div><dt className="text-xs text-muted-foreground">{t('mission.participants')}</dt><dd>{item.spots_filled || 0}/{item.max_participants || '∞'}</dd></div></>
                : <div><dt className="text-xs text-muted-foreground">{t('admin.members')}</dt><dd>{item.member_count || 0}</dd></div>}
              <div><dt className="text-xs text-muted-foreground">{t('admin.status')}</dt><dd className="capitalize">{item.status}</dd></div>
              <div className="flex items-center gap-3">
                {item.is_featured && <span className="inline-flex items-center gap-1 text-xs text-warning"><Star className="w-3 h-3 fill-warning" />{t('admin.featured')}</span>}
                {item.is_hidden && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><EyeOff className="w-3 h-3" />{t('admin.hidden')}</span>}
                {item.is_archived && <span className="inline-flex items-center gap-1 text-xs text-destructive"><Archive className="w-3 h-3" />{t('admin.archived')}</span>}
              </div>
            </dl>
            {item.description && <p className="text-sm text-muted-foreground mt-3">{item.description}</p>}
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Reports ({reports.length})</h4>
            {reports.length === 0 ? <p className="text-sm text-muted-foreground">{t('mission.no_reports')}</p> : (
              <ul className="space-y-2">
                {reports.map((r) => (
                  <li key={r.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex justify-between"><span className="font-medium capitalize">{r.priority} priority</span><span className="text-xs text-muted-foreground capitalize">{r.status}</span></div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.reason}{r.details ? ` — ${r.details}` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.activity_timeline')}</h4>
            <MCActivityTimeline items={activity.map((a) => ({ id: a.id, title: a.action, subtitle: [a.administrator, a.details].filter(Boolean).join(' · '), time: a.created_date }))} />
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.internal_notes_adminonly')}</h4>
            <div className="space-y-2 mb-3">
              {notes.length === 0 ? <p className="text-sm text-muted-foreground">{t('mission.no_notes_yet')}</p> : notes.map((n) => (
                <div key={n.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{n.author}</span>
                    <button onClick={() => removeNote(n.id)} className="hover:text-destructive"><XCircle className="w-3 h-3" /></button>
                  </div>
                  <p>{n.body}</p>
                </div>
              ))}
            </div>
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={t('mission.add_a_private_note')} rows={2} />
            <Button size="sm" className="mt-2" disabled={busy || !noteText.trim()} onClick={submitNote}><Send className="w-3.5 h-3.5" /> {t('mission.add_note')}</Button>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.administrative_actions')}</h4>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(item)}><Pencil className="w-3.5 h-3.5" /> {t('mission.edit')}</Button>
              <Button size="sm" variant="outline" onClick={() => onAction(item, 'feature')}><Star className="w-3.5 h-3.5" /> {item.is_featured ? 'Unfeature' : 'Feature'}</Button>
              <Button size="sm" variant="outline" onClick={() => onAction(item, 'hide')}><EyeOff className="w-3.5 h-3.5" /> {item.is_hidden ? 'Unhide' : 'Hide'}</Button>
              <Button size="sm" variant="outline" onClick={() => onAction(item, 'archive')}><Archive className="w-3.5 h-3.5" /> {t('mission.archive')}</Button>
              <Button size="sm" variant="outline" onClick={() => onAction(item, 'restore')}><RotateCcw className="w-3.5 h-3.5" /> {t('mission.restore')}</Button>
              <Button size="sm" variant="outline" onClick={() => onAction(item, 'reopen')}><RefreshCw className="w-3.5 h-3.5" /> {t('mission.reopen')}</Button>
              <Button size="sm" variant="outline" onClick={() => onAction(item, 'transfer')}><UserCog className="w-3.5 h-3.5" /> {t('mission.transfer')}</Button>
              {type === 'experience' && <Button size="sm" variant="outline" onClick={() => onAction(item, 'cancel')}><XCircle className="w-3.5 h-3.5" /> {t('admin.cancel')}</Button>}
              <Button size="sm" variant="destructive" onClick={() => onAction(item, 'hardDelete')}><Trash2 className="w-3.5 h-3.5" /> Hard Delete</Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}