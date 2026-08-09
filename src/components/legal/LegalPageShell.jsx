import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LEGAL_OPERATOR as _OPERATOR, LEGAL_CONTACTS as _CONTACTS } from '@/lib/legal-config';

// Re-export for backward compatibility — many legal pages import these
// from LegalPageShell. Source of truth is @/lib/legal-config.
export const LEGAL_CONTACTS = _CONTACTS;
export const LEGAL_OPERATOR = _OPERATOR;

// LP-LEGAL-CENTER — Shared shell for all Nmood legal documents.
// Provides: back button, print button, document metadata, sticky TOC,
// cross-links to related documents, and print-friendly styling.
// Legal entity, contacts, and dates are sourced from @/lib/legal-config.

export const LEGAL_LINKS = [
  { to: '/terms', label: 'Terms of Service', docId: 'LP-001' },
  { to: '/privacy', label: 'Privacy Policy', docId: 'LP-002' },
  { to: '/community-guidelines', label: 'Community Guidelines', docId: 'LP-003' },
  { to: '/safety', label: 'Safety Center', docId: 'LP-008' },
  { to: '/refund-policy', label: 'Refund Policy', docId: 'LP-004' },
  { to: '/subscription-terms', label: 'Subscription Terms', docId: 'LP-005' },
  { to: '/cookie-notice', label: 'Cookie Notice', docId: 'LP-006' },
  { to: '/ai-concierge-notice', label: 'AI Concierge Notice', docId: 'LP-007' },
  { to: '/delete-account', label: 'Account Deletion', docId: '—' },
  { to: '/support', label: 'Support', docId: '—' },
];

export function LegalSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-base font-bold mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5">
        {children}
      </div>
    </section>
  );
}

export function LegalBulletList({ items }) {
  return (
    <ul className="list-disc list-inside space-y-1.5 ps-2">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function LegalPageShell({
  icon: Icon,
  title,
  docId,
  version,
  effectiveDate,
  lastUpdated,
  toc = [],
  children,
}) {
  const navigate = useNavigate();
  const handleBack = () => navigate(-1);
  const handlePrint = () => window.print();

  return (
    <div className="max-w-4xl mx-auto pb-12 print:pb-0">
      {/* Header bar */}
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={handleBack} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handlePrint} className="ms-auto">
          <Printer className="w-4 h-4 me-1.5" /> Print
        </Button>
      </div>

      {/* Title block — px-5 lg:px-0 aligns icon + title with the TOC on mobile */}
      <div className="flex items-start gap-3 mb-6 px-5 lg:px-0">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-1.5">
            <span>Document ID: {docId}</span>
            <span>Version: {version}</span>
            <span>Effective: {effectiveDate}</span>
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* TOC sidebar — sticky on desktop, hidden on mobile, hidden in print */}
        {toc.length > 0 && (
          <aside className="lg:w-56 flex-shrink-0 print:hidden px-5 lg:px-0">
            <div className="lg:sticky lg:top-6 max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Contents</p>
              <nav className="space-y-0.5">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-muted-foreground hover:text-primary transition-default py-1 px-1 rounded-md hover:bg-muted/50 break-words"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Content card */}
        <Card className="flex-1 p-6 lg:p-8 print:border-0 print:shadow-none print:p-0">
          {/* Operator notice */}
          <div className="mb-6 pb-4 border-b border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nmood is operated by <strong className="text-foreground">{LEGAL_OPERATOR}</strong> (Trade Licence No. 2625417982888).
            </p>
          </div>

          <div className="space-y-6">{children}</div>

          {/* Cross-links footer */}
          <div className="mt-8 pt-6 border-t border-border print:hidden">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Related Documents</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {LEGAL_LINKS.filter((l) => l.label !== title).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-xs text-primary hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Contact us:{' '}
              <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-primary hover:underline">{LEGAL_CONTACTS.support}</a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}