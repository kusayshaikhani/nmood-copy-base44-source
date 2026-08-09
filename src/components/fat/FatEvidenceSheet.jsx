import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Video, FileText, Trash2, Loader2, Paperclip } from 'lucide-react';
import { useFatExecution } from '@/lib/fat-execution-store.jsx';
import { base44 } from '@/api/base44Client';

function kindForFile(file) {
  if (file.type.startsWith('image/')) return 'screenshot';
  if (file.type.startsWith('video/')) return 'recording';
  return 'other';
}
function iconForKind(kind) {
  if (kind === 'screenshot') return Camera;
  if (kind === 'recording') return Video;
  return FileText;
}

export default function FatEvidenceSheet({ scenarioId, open, onOpenChange }) {
  const { state, setEvidence } = useFatExecution();
  const evidence = state.results[scenarioId]?.evidence || { notes: '', logs: '', attachments: [] };
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        try {
          const resp = await base44.integrations.Core.UploadFile({ file });
          const url = resp?.file_url || resp?.data?.file_url;
          if (url) uploaded.push({ url, name: file.name, type: file.type, kind: kindForFile(file) });
        } catch { /* skip failed */ }
      }
      if (uploaded.length) setEvidence(scenarioId, { attachments: [...(evidence.attachments || []), ...uploaded] });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (idx) =>
    setEvidence(scenarioId, { attachments: (evidence.attachments || []).filter((_, i) => i !== idx) });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Paperclip className="w-4 h-4" /> Test Evidence</SheetTitle>
          <SheetDescription>Attach screenshots, screen recordings, notes and logs.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">Notes</label>
            <Textarea
              rows={3}
              placeholder="Observations, what was verified…"
              value={evidence.notes || ''}
              onChange={(e) => setEvidence(scenarioId, { notes: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Logs</label>
            <Textarea
              rows={4}
              placeholder="Console / network logs…"
              value={evidence.logs || ''}
              onChange={(e) => setEvidence(scenarioId, { logs: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block">Attachments</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFiles} />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-muted/40 text-xs font-medium hover:bg-muted transition-default">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading…' : 'Add screenshot / recording'}
                </span>
              </label>
            </div>

            {(evidence.attachments || []).length > 0 && (
              <div className="space-y-1.5 mt-2">
                {(evidence.attachments || []).map((att, idx) => {
                  const Icon = iconForKind(att.kind);
                  return (
                    <div key={idx} className="flex items-center gap-2 rounded-md border border-border p-2">
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a href={att.url} target="_blank" rel="noreferrer" className="text-xs font-medium truncate hover:text-primary flex-1 min-w-0">{att.name}</a>
                      <span className="text-[10px] uppercase text-muted-foreground">{att.kind}</span>
                      <button type="button" onClick={() => removeAttachment(idx)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}