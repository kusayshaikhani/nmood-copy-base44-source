import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function V2SearchFilters({
  searchRef,
  search,
  onSearchChange,
  onOpenFilters,
  activeCount,
  onClearFilters,
}) {
  return (
    <div>
      <div className="flex items-stretch gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search people, activities or places..."
            className="w-full h-12 pl-12 pr-10 rounded-xl bg-muted/50 border border-border text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <button
          type="button"
          onClick={onOpenFilters}
          className="relative h-12 px-4 rounded-xl bg-muted/50 border border-border flex items-center gap-2 text-foreground hover:bg-muted transition-default"
        >
          <SlidersHorizontal className="w-[18px] h-[18px] text-muted-foreground" />
          <span className="text-[13px] font-medium">Filters</span>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 transition-colors"
        >
          Clear all filters <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}