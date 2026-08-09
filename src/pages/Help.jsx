import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mail, ChevronDown, BookOpen, LifeBuoy, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';

const faqs = [
  { q: 'Is Nmood a dating app?', a: 'No. Nmood is an emotional intelligence platform focused on building meaningful relationships, self-awareness, and social wellbeing — not dating.' },
  { q: 'Is my emotional data private?', a: 'Absolutely. Privacy is core to Nmood. Your data is encrypted, never sold, and you have full control over what you share and delete.' },
  { q: 'When will features be available?', a: 'Nmood is currently in its foundation phase (Release 0.1). Social experiences, journaling, circles, and AI features will roll out in subsequent releases.' },
  { q: 'How much will Nmood cost?', a: 'Pricing details will be announced closer to the full release. The foundation is free to explore.' },
  { q: 'Can I use Nmood offline?', a: 'Some features like journaling will work offline with sync when you reconnect. Full offline support is planned for future releases.' },
];

const resources = [
  { icon: BookOpen, title: 'Getting Started Guide', description: 'Learn the basics of Nmood', to: '/help' },
  { icon: LifeBuoy, title: 'Community Guidelines', description: 'How we keep Nmood safe', to: '/community-guidelines' },
  { icon: ExternalLink, title: 'Terms of Service', description: 'Read our terms', to: '/terms' },
  { icon: ExternalLink, title: 'Privacy Policy', description: 'How we handle your data', to: '/privacy-policy' },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} className="w-full text-left py-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">{item.q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.a}</p>}
    </button>
  );
}

export default function Help() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Help & Support" description="We're here to help you on your journey." />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Chat with us</h3>
          <p className="text-xs text-muted-foreground mb-3">Live chat support</p>
          <Button variant="outline" size="sm" className="w-full">Start Chat</Button>
        </Card>
        <Card className="p-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Email us</h3>
          <p className="text-xs text-muted-foreground mb-3">We reply within 24h</p>
          <Button variant="outline" size="sm" className="w-full">Send Email</Button>
        </Card>
      </div>

      <h2 className="text-lg font-semibold mb-3">FAQs</h2>
      <Card className="px-5 divide-y divide-border mb-6">
        {faqs.map((faq) => (
          <FaqItem key={faq.q} item={faq} />
        ))}
      </Card>

      <h2 className="text-lg font-semibold mb-3">Resources</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.title} to={r.to} className="block">
              <Card className="p-4 flex items-center gap-3 hover-lift cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}