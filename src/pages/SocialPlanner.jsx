import React from 'react';
import { motion } from 'framer-motion';
import PlannerHeader from '@/components/social-planner/PlannerHeader';
import TodaySection from '@/components/social-planner/TodaySection';
import ThisWeekSection from '@/components/social-planner/ThisWeekSection';
import SocialEnergySection from '@/components/social-planner/SocialEnergySection';
import SocialGoalsSection from '@/components/social-planner/SocialGoalsSection';
import QuickActionsSection from '@/components/social-planner/QuickActionsSection';
import SuggestionsSection from '@/components/social-planner/SuggestionsSection';
import CalendarSummarySection from '@/components/social-planner/CalendarSummarySection';

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const Section = ({ children, i }) => (
  <motion.div custom={i} initial="hidden" animate="visible" variants={sectionVariants}>
    {children}
  </motion.div>
);

export default function SocialPlanner() {
  return (
    <div className="space-y-6 pb-6">
      <PlannerHeader />

      <Section i={1}><TodaySection /></Section>
      <Section i={2}><ThisWeekSection /></Section>
      <Section i={3}><SocialEnergySection /></Section>
      <Section i={4}><SocialGoalsSection /></Section>
      <Section i={5}><QuickActionsSection /></Section>
      <Section i={6}><SuggestionsSection /></Section>
      <Section i={7}><CalendarSummarySection /></Section>
    </div>
  );
}