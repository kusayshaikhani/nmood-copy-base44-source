import React from 'react';
import { Card } from '@/components/ui/card';
import SectionReveal from '@/components/experience/SectionReveal';
import { useSettingsSearch } from './SettingsSearchContext';

/**
 * UI-022 — Premium grouped settings card. Renders a small uppercase section
 * title (with optional icon) and a rounded, softly-shadowed card containing
 * the rows. Rows are filtered by the settings search term via their
 * `searchKeys` prop; the whole section hides when nothing matches.
 */
export default function SettingsGroupCard({ title, icon: Icon, children, delay = 0 }) {
  const { searchTerm } = useSettingsSearch();
  const kids = React.Children.toArray(children).filter(Boolean);
  const term = searchTerm.trim().toLowerCase();
  const visible = term
    ? kids.filter((child) => {
        const keys = (child.props?.searchKeys || []).join(' ').toLowerCase();
        const titleText = (child.props?.title || '').toLowerCase();
        return keys.includes(term) || titleText.includes(term);
      })
    : kids;

  if (visible.length === 0) return null;

  return (
    <SectionReveal delay={delay}>
      <div>
        <div className="flex items-center gap-2 mb-2.5 px-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </h2>
        </div>
        <Card className="overflow-hidden divide-y divide-border/60 rounded-card">
          {visible}
        </Card>
      </div>
    </SectionReveal>
  );
}