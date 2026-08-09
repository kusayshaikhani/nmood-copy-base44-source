import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Target, Archive } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import GoalCard from '@/components/goals/GoalCard';
import GoalSetupSheet from '@/components/goals/GoalSetupSheet';

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  const loadGoals = async () => {
    if (!user) return;
    try {
      const records = await base44.entities.LifeGoal.filter({ created_by_id: user.id });
      setGoals(records);
      if (records.length === 0) setShowSetup(true);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [user]);

  const handleConfirm = async (selectedKeys) => {
    try {
      await base44.entities.LifeGoal.bulkCreate(
        selectedKeys.map((key) => ({
          goal_key: key,
          status: 'active',
          progress: 0,
          started_date: new Date().toISOString().split('T')[0],
        }))
      );
      setShowSetup(false);
      loadGoals();
    } catch {
    }
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const pausedGoals = goals.filter((g) => g.status === 'paused');
  const existingKeys = goals.map((g) => g.goal_key);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Life Goals</h1>
          <p className="text-sm text-muted-foreground">What are you Nmood to improve?</p>
        </div>
        {goals.length > 0 && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowSetup(true)}>
            <Plus className="w-4 h-4" /> Add
          </Button>
        )}
      </div>

      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center py-16 px-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1.5">No goals yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            What are you Nmood to improve? Set your first goals and we'll guide you toward experiences that help you get there.
          </p>
          <Button className="gap-2" onClick={() => setShowSetup(true)}>
            <Plus className="w-4 h-4" /> Choose Goals
          </Button>
        </motion.div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
              {activeGoals.map((goal, i) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GoalCard goal={goal} onClick={() => navigate(`/goals/${goal.id}`)} />
                </motion.div>
              ))}
            </div>
          )}

          {pausedGoals.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Archive className="w-4 h-4" /> Paused Goals
              </p>
              {pausedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onClick={() => navigate(`/goals/${goal.id}`)} />
              ))}
            </div>
          )}
        </>
      )}

      <GoalSetupSheet
        open={showSetup}
        onOpenChange={setShowSetup}
        onConfirm={handleConfirm}
        existingKeys={existingKeys}
      />
    </div>
  );
}