import React from 'react';
import { Heart, Sparkles, Shield, Users } from 'lucide-react';
import BrandIcon from '@/components/brand/BrandIcon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import { APP_VERSION } from '@/lib/system-config';

const values = [
  { icon: Heart, title: 'Empathy First', description: 'Every feature is designed with emotional wellbeing at its center.' },
  { icon: Shield, title: 'Privacy by Design', description: 'Your data is yours. We never sell it, and you control everything.' },
  { icon: Users, title: 'Meaningful Connections', description: 'We prioritize depth over breadth in every relationship.' },
  { icon: Sparkles, title: 'Growth Oriented', description: 'We believe everyone can grow with the right tools and support.' },
];

export default function About() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="About Nmood" description="Life Feels Better Together." />

      <Card className="p-8 mb-6 text-center">
        <div className="mx-auto mb-5">
          <BrandIcon size="xl" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Nmood</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          An AI-powered emotional intelligence platform that helps people build meaningful relationships, improve emotional wellbeing, discover social experiences, and grow through self-awareness.
        </p>
        <p className="text-xs text-muted-foreground mt-4">Version {APP_VERSION}</p>
      </Card>

      <h2 className="text-lg font-semibold mb-4">Our Values</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {values.map((v) => {
          const Icon = v.icon;
          return (
            <Card key={v.title} className="p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{v.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.description}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-sm mb-3">Our Promise</h3>
        <div className="space-y-2.5">
          {[
            'Real people, real-world experiences — never endless scrolling.',
            'Your privacy comes first. You control what you share.',
            'Less time online, more time living.',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 mt-6">
        <Button variant="outline" className="flex-1" asChild>
          <Link to="/help">Help Center</Link>
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link to="/privacy">Privacy</Link>
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link to="/terms">Terms of Service</Link>
        </Button>
      </div>
    </div>
  );
}