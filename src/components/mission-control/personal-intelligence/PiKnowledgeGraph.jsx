import React from 'react';
import { GitBranch } from 'lucide-react';
import { MCSection, MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { BiBarChart } from '../bi/BiChart';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** AI-002 — Knowledge graph architecture (server-side only; stats shown, never internal structure). */
export default function PiKnowledgeGraph({ metrics }) {
  const { t } = useLocalization();
  const g = (metrics || {}).graphStats || { nodes: {}, edges: {} };
  const nodes = g.nodes || {};
  const edges = g.edges || {};
  const nodeData = [
    { label: 'Members', value: nodes.members || 0 },
    { label: 'Interests', value: nodes.interests || 0 },
    { label: 'Experiences', value: nodes.experiences || 0 },
    { label: 'Circles', value: nodes.circles || 0 },
    { label: 'Locations', value: nodes.locations || 0 },
    { label: 'Languages', value: nodes.languages || 0 },
    { label: 'Categories', value: nodes.categories || 0 },
  ].sort((a, b) => b.value - a.value);
  const kpis = [
    { icon: GitBranch, label: 'Graph Nodes', value: nodes.total || 0, color: 'primary' },
    { icon: GitBranch, label: 'Graph Edges', value: edges.total || 0, color: 'info' },
    { icon: GitBranch, label: 'Concept Links', value: edges.concept_related || 0, color: 'success' },
  ];
  return (
    <div className="space-y-4">
      <MCSection icon={GitBranch} title={t('mission.centralized_semantic_knowledge_graph')}>
        <p className="text-xs text-muted-foreground mb-2">
          {t('mission.connects_members_interests_experiences_circles')}
        </p>
      </MCSection>
      <MCKpiGrid>{kpis.map((k) => <MCKpiCard key={k.label} {...k} />)}</MCKpiGrid>
      <MCSection icon={GitBranch} title={t('mission.nodes_by_type')}>
        <BiBarChart data={nodeData} bars={[{ key: 'value', name: 'Nodes', color: 'hsl(var(--chart-1))' }]} />
      </MCSection>
      <MCSection icon={GitBranch} title={t('mission.edge_types')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg border bg-card/60 p-3"><p className="text-muted-foreground">{t('mission.member_interest')}</p><p className="text-lg font-semibold">{edges.member_interest || 0}</p></div>
          <div className="rounded-lg border bg-card/60 p-3"><p className="text-muted-foreground">{t('mission.member_circle')}</p><p className="text-lg font-semibold">{edges.member_circle || 0}</p></div>
          <div className="rounded-lg border bg-card/60 p-3"><p className="text-muted-foreground">{t('mission.member_experience')}</p><p className="text-lg font-semibold">{edges.member_experience || 0}</p></div>
          <div className="rounded-lg border bg-card/60 p-3"><p className="text-muted-foreground">{t('mission.concept_related')}</p><p className="text-lg font-semibold">{edges.concept_related || 0}</p></div>
        </div>
      </MCSection>
    </div>
  );
}