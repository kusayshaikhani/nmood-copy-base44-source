import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export default function ConnectionSuggestion({ suggestion }) {
  const Icon = suggestion.icon;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{suggestion.title}</p>
          <p className="text-xs text-muted-foreground">{suggestion.description}</p>
        </div>
        <Button variant="outline" size="sm" className="flex-shrink-0 gap-1">
          {suggestion.action}
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}