import React from 'react';
import { motion } from 'framer-motion';
import { ScrollText, MessageSquare, UserCheck, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CommunityRules({ community }) {
  const { t } = useLocalization();
  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ScrollText className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">{t('community.rules.title')}</h3>
          </div>
          <ul className="space-y-2">
            {(community.rules || []).map((rule, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary font-semibold flex-shrink-0">{i + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">{t('community.about.posting_guidelines')}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{community.posting_guidelines}</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">{t('community.about.requirements')}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{community.membership_requirements}</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">{t('community.rules.safety')}</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('community.rules.safety_desc')}
          </p>
        </Card>
      </motion.div>
    </div>
  );
}