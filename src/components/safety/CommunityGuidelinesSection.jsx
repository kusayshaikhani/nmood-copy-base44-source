import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { communityGuidelines } from '@/lib/safety-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CommunityGuidelinesSection() {
  const { t } = useLocalization();
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{t('community.guidelines.title')}</h2>
        <Link to="/community-guidelines" className="flex items-center gap-0.5 text-xs text-primary hover:underline">
          Read all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {communityGuidelines.slice(0, 4).map((guide) => {
          const Icon = guide.icon;
          return (
            <Card key={guide.title} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{guide.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{guide.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}