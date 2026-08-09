import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * FM-004 — Standard Mission Control module header.
 * Icon · Name · Description · Breadcrumb · Last Updated.
 */
export default function MCModuleHeader({ icon: Icon, title, description, breadcrumb = [], lastUpdated }) {
  const { t } = useLocalization();
  return (
    <div className="mb-5">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-2 flex-wrap" aria-label={t('mission.breadcrumb')}>
        <Link to="/mission-control" className="hover:text-foreground transition-default">{t('mission.mission_control')}</Link>
        {breadcrumb.map((b) => (
          <React.Fragment key={b.label}>
            <ChevronRight className="w-3 h-3" />
            {b.to ? (
              <Link to={b.to} className="hover:text-foreground transition-default">{b.label}</Link>
            ) : (
              <span className="text-foreground font-medium">{b.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap mt-1">Updated {lastUpdated}</p>
        )}
      </div>
    </div>
  );
}