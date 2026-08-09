import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getGreeting } from '@/lib/social-planner-data';

export default function PlannerHeader() {
  const greeting = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground"
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium opacity-90">My Social Planner</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{greeting}.</h1>
        <p className="text-sm opacity-90">What are you Nmood for today?</p>
      </div>
    </motion.div>
  );
}