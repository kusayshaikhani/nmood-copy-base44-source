import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Bell } from 'lucide-react';

function IconBtn({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white/90 hover:bg-white/25 hover:text-white transition-colors duration-200"
    >
      {children}
    </button>
  );
}

export default function InMoodPeopleHero({ search, onSearchChange, onFilter }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative bg-nmood-gradient px-4 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-10">
      {/* soft glow accents — clipped to hero bounds */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="nmood-glow -top-16 -right-12 w-48 h-48 bg-white/20" />
        <div className="nmood-glow top-12 -left-16 w-44 h-44 bg-indigo-300/30" />
      </div>
      {/* Top bar — logo left, notification / search / filter right */}
      <header
        className={`sticky top-0 z-30 -mx-4 px-4 transition-all duration-300 ${
          scrolled
            ? 'bg-[#24156D]/85 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="flex items-center justify-between h-14">
          <span className="text-[22px] font-extrabold tracking-tight text-white leading-none select-none">
            Nmood
          </span>
          <div className="flex items-center gap-2">
            <IconBtn onClick={() => navigate('/notifications')} label="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-white border border-white/60" />
            </IconBtn>
            <IconBtn onClick={() => navigate('/search')} label="Search">
              <Search className="w-5 h-5" />
            </IconBtn>
            <IconBtn onClick={onFilter} label="Filters">
              <SlidersHorizontal className="w-5 h-5" />
            </IconBtn>
          </div>
        </div>
      </header>

      {/* Title + subtitle + premium search */}
      <div className="relative pt-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight leading-[1.12] text-white text-balance">
            What are people Nmood for today?
          </h1>
          <p className="text-sm text-white/75 mt-2 tracking-tight">
            Real plans. Real people. Real life.
          </p>
        </motion.div>

        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search people, activities or places"
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 text-sm font-medium text-white placeholder:text-white/70 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/25 transition-[border-color,box-shadow] duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}