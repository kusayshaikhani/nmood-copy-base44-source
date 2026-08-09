import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { smartSuggestions } from '@/lib/social-planner-data';

export default function SuggestionsSection() {
  const navigate = useNavigate();

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-warning" />
        <h2 className="text-lg font-semibold">Suggestions</h2>
      </div>

      <div className="space-y-2">
        {smartSuggestions.map((suggestion, i) => (
          <motion.button
            key={suggestion.id}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => navigate(suggestion.link)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-default text-left"
          >
            <span className="text-xl flex-shrink-0">{suggestion.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">{suggestion.text}</p>
              <p className="text-xs text-primary mt-0.5">{suggestion.action}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}