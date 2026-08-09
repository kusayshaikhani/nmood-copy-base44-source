import React from 'react';
import { Card } from '@/components/ui/card';
import { STATUS_META, STATUSES } from '@/lib/store-readiness';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function StoreReadinessItem({ item, status, onCycle, note, onNote }) {
  const { t } = useLocalization();
  const meta = STATUS_META[status] || STATUS_META.needsFounder;
  const next = () => {
    const idx = STATUSES.indexOf(status);
    onCycle(item.id, STATUSES[(idx + 1) % STATUSES.length]);
  };

  return (
    <Card className="p-3">
      <button onClick={next} className="flex items-start gap-3 w-full text-left">
        <span className={'mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ' + meta.dot} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold truncate">{item.label}</h4>
            <span className={'text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ' + meta.chip}>
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">Owner: {item.owner}</p>
        </div>
      </button>
      <input
        value={note || ''}
        onChange={(e) => onNote(item.id, e.target.value)}
        placeholder={t('mission.verification_note_evidence_link')}
        className="mt-2 w-full text-xs px-2.5 py-1.5 rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </Card>
  );
}