import React from 'react';
import { BookOpen } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Row({ label, value, list }) {
  const placeholder = value === null || value === undefined;
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={placeholder ? 'text-sm text-muted-foreground/60 font-medium' : 'text-sm font-semibold'}>{placeholder ? 'Awaiting data' : value}</span>
      </div>
      {list && list.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {list.map((x) => <span key={x} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{x}</span>)}
          {list.length === 0 && null}
        </div>
      )}
    </div>
  );
}

export default function AiKnowledge({ knowledge }) {
  const { t } = useLocalization();
  return (
    <MCSection icon={BookOpen} title={t('mission.ai_knowledge')}>
      <div className="space-y-2">
        <Row label="Active Interests" value={knowledge.activeInterests?.name} list={knowledge.activeInterests?.list} />
        <Row label="Experience Categories" value={knowledge.experienceCategories?.name} list={knowledge.experienceCategories?.list} />
        <Row label="Circle Categories" value={knowledge.circleCategories?.name} list={knowledge.circleCategories?.list} />
        <Row label="Semantic Concepts" value={knowledge.semanticConcepts} />
        <Row label="Language Models" value={knowledge.languageModels} />
        <Row label="Translation Coverage" value={knowledge.translationCoverage} />
      </div>
      <p className="text-[10px] text-muted-foreground/70 mt-2">{t('mission.ai_knowledge_management_reserved_for')}</p>
    </MCSection>
  );
}