import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { goalDefinitions } from '@/lib/goals-data';

export default function GoalSetupSheet({ open, onOpenChange, onConfirm, existingKeys = [] }) {
  const [selected, setSelected] = useState([]);

  const toggle = (key) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleConfirm = () => {
    onConfirm(selected);
    setSelected([]);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="What are you Nmood to improve?"
      description="Choose as many as you like. You can change these anytime."
    >
      <div className="grid grid-cols-2 gap-2 pb-2">
        {goalDefinitions.map((goal) => {
          const isSelected = selected.includes(goal.key);
          const hasGoal = existingKeys.includes(goal.key);
          const Icon = goal.icon;
          return (
            <motion.button
              key={goal.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => !hasGoal && toggle(goal.key)}
              disabled={hasGoal}
              type="button"
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-default text-center ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : hasGoal
                  ? 'border-border bg-muted/50 opacity-60'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              {hasGoal && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <Check className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {goal.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      <Button
        className="w-full mt-4"
        disabled={selected.length === 0}
        onClick={handleConfirm}
      >
        Add {selected.length > 0 ? `${selected.length} Goal${selected.length > 1 ? 's' : ''}` : 'Goals'}
      </Button>
    </BottomSheet>
  );
}