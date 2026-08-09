import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Award } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CircleMemories({ circle }) {
  const photos = (circle.recent_memories || []).filter((m) => m.type === 'photo');
  const milestones = (circle.recent_memories || []).filter((m) => m.type === 'milestone');

  const { t } = useLocalization();
  return (
    <div className="space-y-5">
      {photos.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Camera className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">{t('circles.memories.photos')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((mem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl overflow-hidden border border-border"
              >
                <img src={mem.url} alt={mem.caption} className="w-full h-24 object-cover" loading="lazy" />
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{mem.caption}</p>
                  <p className="text-[10px] text-muted-foreground">{mem.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {milestones.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Award className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">{t('circles.memories.milestones')}</h3>
          </div>
          <div className="space-y-2">
            {milestones.map((mem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{mem.title}</p>
                  <p className="text-xs text-muted-foreground">{mem.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}