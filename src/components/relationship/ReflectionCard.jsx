import React from 'react';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export default function ReflectionCard({ reflection }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{reflection.activity}</h3>
          <p className="text-xs text-muted-foreground">{reflection.date}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">{reflection.mood}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mt-2">{reflection.text}</p>
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
        <Lock className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Private reflection — only visible to you</span>
      </div>
    </Card>
  );
}