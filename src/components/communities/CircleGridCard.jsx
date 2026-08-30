import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

/**
 * Compact circle card for the immersive two-column grid.
 * Edge-to-edge image, dark bottom gradient, bold name, member count.
 * CSS gradient fallback behind image for broken/missing covers.
 */
export default function CircleGridCard({ community, index = 0 }) {
  const { id, cover_photo, name, member_count } = community || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3, ease: 'easeOut' }}
    >
      <Link
        to={`/circle/${id}`}
        className="block relative aspect-[3/4] rounded-2xl overflow-hidden pressable-card"
      >
        {/* Gradient fallback always present behind image */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/20" />

        {/* Cover image on top of gradient */}
        {cover_photo && (
          <img
            src={cover_photo}
            alt={name}
            className="relative w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.style.opacity = '0'; }}
          />
        )}

        {/* Dark bottom gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Name + member count */}
        <div className="absolute bottom-0 start-0 end-0 p-3">
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 text-balance">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Users className="w-3 h-3 text-white/70" />
            <span className="text-white/70 text-[11px] font-medium">
              {member_count || 0}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}