import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import GoalDetailHero from '@/components/goals/GoalDetailHero';
import GoalWeeklyProgress from '@/components/goals/GoalWeeklyProgress';
import GoalSuggestions from '@/components/goals/GoalSuggestions';
import GoalMilestones from '@/components/goals/GoalMilestones';

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const loadGoal = async () => {
    try {
      const record = await base44.entities.LifeGoal.get(id);
      setGoal(record);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoal();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await base44.entities.LifeGoal.update(id, { status: newStatus });
      loadGoal();
    } catch {
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    try {
      await base44.entities.LifeGoal.delete(id);
      navigate('/goals');
    } catch {
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-1.5">Goal not found</h3>
        <p className="text-sm text-muted-foreground mb-6">This goal may have been removed.</p>
        <Button onClick={() => navigate('/goals')}>Back to Goals</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <button
        onClick={() => navigate('/goals')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-default"
        type="button"
      >
        <ChevronLeft className="w-4 h-4" /> Goals
      </button>

      <GoalDetailHero
        goal={goal}
        onStatusChange={handleStatusChange}
        onRemove={handleRemove}
      />

      {confirmRemove && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-destructive/20 bg-destructive/5 flex items-center justify-between gap-3"
        >
          <p className="text-sm text-destructive">Remove this goal permanently?</p>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setConfirmRemove(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleRemove}>Remove</Button>
          </div>
        </motion.div>
      )}

      <GoalWeeklyProgress goalKey={goal.goal_key} />
      <GoalSuggestions goalKey={goal.goal_key} />
      <GoalMilestones goalKey={goal.goal_key} />
    </div>
  );
}