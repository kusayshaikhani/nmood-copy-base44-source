import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Eye } from 'lucide-react';

/**
 * Lightweight preview-only detail sheet for design-sample circles.
 * Does NOT navigate to a real circle route or create any database records.
 */
export default function PreviewCircleDetailSheet({ circle, onClose }) {
  return (
    <AnimatePresence>
      {circle && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto rounded-t-[32px] overflow-hidden bg-card shadow-dialog"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 end-3 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Cover image */}
            <div className="relative h-56 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/20" />
              {circle.cover_photo && (
                <img
                  src={circle.cover_photo}
                  alt={circle.name}
                  className="relative w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 start-4 end-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/80 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-wide">
                  <Eye className="w-3 h-3" />
                  Preview
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h2 className="text-xl font-bold text-foreground leading-tight">
                {circle.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground text-sm font-medium">
                  {circle.member_count} members
                </span>
                <span className="text-muted-foreground/40 text-sm">·</span>
                <span className="text-muted-foreground text-sm font-medium">
                  {circle.category}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mt-3">
                {circle.description}
              </p>

              <div className="mt-4 p-3 rounded-xl bg-secondary/60 border border-border/40">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is a design preview. Real circles will appear here once they are created.
                  Tap the <span className="font-semibold text-primary">+</span> button to start your own.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full h-12 mt-4 rounded-button bg-secondary text-secondary-foreground font-semibold text-sm active:scale-95 transition-transform"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}