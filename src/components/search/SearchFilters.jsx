import React from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { searchOptionLabel } from '@/lib/i18n/label-resolvers';

export default function SearchFilters({ definitions, state, onChange }) {
  const { t } = useLocalization();
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {definitions.map((f) => {
        const isActive = state[f.id] !== 'Any';
        return (
          <DropdownMenu key={f.id}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-default border ${
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted/50'
                }`}
              >
                {t('search.filter.' + f.id)}
                {isActive && <span className="text-primary">: {searchOptionLabel(t, state[f.id])}</span>}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {f.options.map((opt) => (
                <DropdownMenuItem key={opt} onClick={() => onChange(f.id, opt)} className={state[f.id] === opt ? 'font-semibold' : ''}>
                  {searchOptionLabel(t, opt)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}