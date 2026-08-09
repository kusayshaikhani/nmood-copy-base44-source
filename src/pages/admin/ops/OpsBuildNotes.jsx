import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildNotes } from '@/lib/ops-data';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

function NoteSection({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs font-normal">{item}</Badge>
        ))}
      </div>
    </div>
  );
}

export default function OpsBuildNotes() {
  const { t } = useLocalization();
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t('mission.build_notes')}</h1>
        <p className="text-sm text-muted-foreground">{t('mission.record_features_fixes_and_changes')}</p>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3">{t('mission.new_build_note')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <Label className="text-xs">{t('mission.version')}</Label>
            <Input placeholder="v0.4.0" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t('mission.release_stage')}</Label>
            <Input placeholder={t('mission.closed_beta')} className="mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{t('mission.features_one_per_line')}</Label>
            <Textarea placeholder={'New feature 1\nNew feature 2'} className="mt-1 min-h-[80px]" />
          </div>
          <div>
            <Label className="text-xs">{t('mission.bug_fixes_one_per_line')}</Label>
            <Textarea placeholder={'Fixed issue 1'} className="mt-1 min-h-[80px]" />
          </div>
          <div>
            <Label className="text-xs">{t('mission.breaking_changes_one_per_line')}</Label>
            <Textarea placeholder={'None'} className="mt-1 min-h-[80px]" />
          </div>
          <div>
            <Label className="text-xs">{t('mission.known_issues_one_per_line')}</Label>
            <Textarea placeholder={'Known issue 1'} className="mt-1 min-h-[80px]" />
          </div>
        </div>
        <Button className="mt-3" size="sm">{t('mission.save_build_note')}</Button>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t('mission.previous_notes')}</h3>
        {buildNotes.map((note) => (
          <Card key={note.id} className="p-4">
            <button
              onClick={() => setExpanded(expanded === note.id ? null : note.id)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                {expanded === note.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-bold">{note.version}</p>
                  <p className="text-xs text-muted-foreground">{note.release} · {note.date}</p>
                </div>
              </div>
              <Badge variant="secondary">{note.release}</Badge>
            </button>
            {expanded === note.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <NoteSection label="Features" items={note.features} />
                <NoteSection label="Bug Fixes" items={note.bugFixes} />
                <NoteSection label="Breaking Changes" items={note.breakingChanges} />
                <NoteSection label="Known Issues" items={note.knownIssues} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}