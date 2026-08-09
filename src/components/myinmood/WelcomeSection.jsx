import React from 'react';
import { motion } from 'framer-motion';
import IntentionSelector from '@/components/home/IntentionSelector';

export default function WelcomeSection({ member, user }) {
  const firstName = member?.first_name || member?.display_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'there';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20"
    >
      <p className="text-sm text-muted-foreground">Welcome back,</p>
      <h2 className="text-lg font-bold mb-3">{firstName} 👋</h2>
      <IntentionSelector />
    </motion.div>
  );
}