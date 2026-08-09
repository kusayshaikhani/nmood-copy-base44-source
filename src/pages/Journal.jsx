import React from 'react';
import { BookOpen, PenLine, Sparkles, Tag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import PlaceholderCard from '@/components/shared/PlaceholderCard';
import EmptyState from '@/components/shared/EmptyState';

const features = [
  { icon: PenLine, title: 'Reflective Journaling', description: 'Capture your thoughts, emotions, and daily reflections with a beautiful, distraction-free editor.', badge: 'Soon' },
  { icon: Sparkles, title: 'AI Prompts', description: 'Get thoughtful writing prompts tailored to your emotional state and growth journey.', badge: 'Soon' },
  { icon: Tag, title: 'Tags & Categories', description: 'Organize entries with tags to track patterns and themes over time.', badge: 'Soon' },
  { icon: Search, title: 'Search & Filter', description: 'Find past entries instantly with powerful search and smart filters.', badge: 'Soon' },
];

export default function Journal() {
  return (
    <div>
      <PageHeader
        title="Journal"
        description="Reflect, capture, and grow through mindful journaling."
        action={<Button disabled className="gap-2"><PenLine className="w-4 h-4" />New Entry</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {features.map((item) => (
          <PlaceholderCard key={item.title} {...item} />
        ))}
      </div>

      <EmptyState
        icon={BookOpen}
        title="Nothing here yet"
        description="Your reflections will live here. Start writing to capture how you feel."
        actionLabel="Write First Entry"
        onAction={() => {}}
      />
    </div>
  );
}