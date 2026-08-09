import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, LifeBuoy, Shield, FileText, Receipt, Trash2, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LEGAL_CONTACTS, LEGAL_OPERATOR } from '@/components/legal/LegalPageShell';
import { usePageTitle } from '@/lib/usePageTitle';

// Public Support page — displays support@nmood.app and links to legal pages.
// Accessible without authentication.

const legalLinks = [
  { to: '/privacy', label: 'Privacy Policy', desc: 'How we handle your data', icon: Shield },
  { to: '/terms', label: 'Terms of Service', desc: 'Your agreement with Nmood', icon: FileText },
  { to: '/refund-policy', label: 'Refund Policy', desc: 'Refunds and chargebacks', icon: Receipt },
  { to: '/account-deletion', label: 'Account Deletion', desc: 'How to delete your account and data', icon: Trash2 },
];

export default function Support() {
  usePageTitle('Support');
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <LifeBuoy className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            We're here to help. Reach out and we'll respond within a reasonable timeframe.
          </p>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Email Support</h2>
            <p className="text-xs text-muted-foreground">Primary support channel</p>
          </div>
        </div>
        <a href={`mailto:${LEGAL_CONTACTS.support}`} className="text-lg font-semibold text-primary hover:underline break-all">
          {LEGAL_CONTACTS.support}
        </a>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          For account assistance, technical support, subscription access issues, billing questions, and general enquiries.
        </p>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-sm font-semibold mb-3">Other Contacts</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">General Enquiries</p>
            <a href={`mailto:${LEGAL_CONTACTS.general}`} className="text-sm text-primary hover:underline">{LEGAL_CONTACTS.general}</a>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Business & Legal</p>
            <a href={`mailto:${LEGAL_CONTACTS.business}`} className="text-sm text-primary hover:underline">{LEGAL_CONTACTS.business}</a>
          </div>
        </div>
      </Card>

      <h2 className="text-sm font-semibold mb-3">Legal & Policies</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {legalLinks.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.to} to={l.to} className="block">
              <Card className="p-4 flex items-center gap-3 hover-lift cursor-pointer h-full">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{l.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-8 leading-relaxed">
        Nmood is operated by <strong className="text-foreground">{LEGAL_OPERATOR}</strong>.
      </p>
    </div>
  );
}