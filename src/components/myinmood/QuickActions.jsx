import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, UserPlus, Compass, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const actions = [
  { label: 'Host an Experience', icon: Sparkles, path: '/host/create', variant: 'default' },
  { label: 'Invite Again', icon: UserPlus, path: '/pals', variant: 'outline' },
  { label: 'Find Something New', icon: Compass, path: '/explore', variant: 'outline' },
  { label: 'Update Goals', icon: Target, path: '/goals', variant: 'outline' },
];

export default function QuickActions({ navigate }) {
  return (
    <section>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                variant={action.variant}
                className="w-full h-auto py-3 flex-col gap-1.5"
                onClick={() => navigate(action.path)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium leading-tight">{action.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}