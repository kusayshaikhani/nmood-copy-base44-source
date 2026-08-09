import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * ConciergeEntryCard — premium secondary shortcut to the Nmood AI Concierge
 * surfaced on Discover. Mirrors the concierge's own gradient hero so the
 * feature reads as one intentional, branded product surface — not a debug
 * link. Routes to /nmood (the concierge's canonical home under the Nmood tab).
 */
export default function ConciergeEntryCard() {
  const navigate = useNavigate();
  return (
    <motion.button
      type="button"
      onClick={() => navigate("/nmood")}
      whileTap={{ scale: 0.99, transition: { duration: 0.15 } }}
      className="group relative w-full overflow-hidden rounded-[28px] p-6 text-start shadow-elevated transition-default focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      style={{ background: "linear-gradient(135deg, #24156D 0%, #5B3DF5 55%, #8B5CF8 100%)" }}
    >
      <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">Nmood AI Concierge</span>
          <h2 className="mt-1 font-heading text-[18px] font-bold leading-snug tracking-tight text-white">
            Tell us your mood. We'll find your people.
          </h2>
          <p className="mt-1 text-[12.5px] font-light leading-relaxed text-white/75">
            Personalized matches for tonight — people, circles, and experiences tuned to your energy.
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-primary shadow-lg transition-default group-hover:gap-2.5 sm:inline-flex">
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.button>
  );
}