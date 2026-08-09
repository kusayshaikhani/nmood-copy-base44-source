import React from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { getCategoryIcon } from './category-icons';

/**
 * Dark-styled bottom sheet for circle search / filter / sort.
 * Preserves all filter functionality without occupying the main screen.
 */
export default function CircleFilterSheet({
  open, onOpenChange,
  search, setSearch,
  category, setCategory,
  sortBy, setSortBy,
  categories, sortOptions, t,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[80vh] overflow-y-auto momentum-scroll"
        style={{ backgroundColor: '#111827', animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Search &amp; Filter</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center touch-target"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circles..."
            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 ps-10 pe-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Category chips */}
        <div className="mb-5">
          <p className="text-sm font-medium text-white/80 mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('All')}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium border transition-default ${
                category === 'All' ? 'bg-primary text-white border-transparent' : 'border-white/10 bg-white/5 text-white/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              All
            </button>
            {categories.map((cat) => {
              const CatIcon = getCategoryIcon(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium border transition-default ${
                    category === cat ? 'bg-primary text-white border-transparent' : 'border-white/10 bg-white/5 text-white/60'
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort options */}
        <div>
          <p className="text-sm font-medium text-white/80 mb-2">Sort by</p>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-default ${
                  sortBy === opt.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/60'
                }`}
              >
                {t(opt.key)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}