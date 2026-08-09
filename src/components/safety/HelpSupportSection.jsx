import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { helpSupport } from '@/lib/safety-data';

export default function HelpSupportSection() {
  const navigate = useNavigate();

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold mb-3">Help & Support</h2>
      <Card className="divide-y divide-border">
        {helpSupport.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/40 transition-default text-start"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </Card>
    </section>
  );
}