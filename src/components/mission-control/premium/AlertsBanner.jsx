import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ChevronRight } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-025 — Inline alert banner surfacing computeAlerts output at the top of
 * the dashboard. Presentation only; the alerts array comes from the existing
 * computeAlerts helper (unchanged).
 */
const COLOR = { critical: 'text-destructive', warning: 'text-warning' };
const DOT = { critical: 'bg-destructive', warning: 'bg-warning' };

export default function AlertsBanner({ alerts }) {
  const { t } = useLocalization();
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="rounded-card glass shadow-card p-3 animate-fade-in-up">
      <div className="flex items-start gap-2.5">
        <AlertOctagon className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
        <ul className="flex-1 space-y-1.5">
          {alerts.map((a, i) => (
            <li key={i}>
              <Link to={a.to} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-default">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[a.level] || 'bg-muted-foreground/40'}`} />
                <span className="text-sm flex-1">{a.title}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}