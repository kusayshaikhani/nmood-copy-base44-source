import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Receipt, Trash2, LifeBuoy, Users, CreditCard, Cookie, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LEGAL_OPERATOR } from '@/components/legal/LegalPageShell';
import { usePageTitle } from '@/lib/usePageTitle';

// Public Legal & Support Center — single hub linking to every legal document
// and the support page. Accessible without authentication.

const cards = [
  { to: '/privacy', label: 'Privacy Policy', desc: 'How we handle your data', icon: Shield },
  { to: '/terms', label: 'Terms of Service', desc: 'Your agreement with Nmood', icon: FileText },
  { to: '/refund-policy', label: 'Refund Policy', desc: 'Refunds and chargebacks', icon: Receipt },
  { to: '/account-deletion', label: 'Account Deletion', desc: 'How to delete your account and data', icon: Trash2 },
  { to: '/support', label: 'Support', desc: 'Contact our support team', icon: LifeBuoy },
  { to: '/community-guidelines', label: 'Community Guidelines', desc: 'Rules for our community', icon: Users },
  { to: '/subscription-terms', label: 'Subscription Terms', desc: 'Plans, renewal & cancellation', icon: CreditCard },
  { to: '/cookie-notice', label: 'Cookie Notice', desc: 'Cookies and tracking', icon: Cookie },
  { to: '/ai-concierge-notice', label: 'AI Concierge Notice', desc: 'How AI recommendations work', icon: Sparkles },
];

export default function LegalCenter() {
  usePageTitle('Legal & Support Center');
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Legal & Support Center</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Nmood is operated by <strong className="text-foreground">{LEGAL_OPERATOR}</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to} className="block">
              <Card className="p-4 flex items-center gap-3 hover-lift cursor-pointer h-full">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}