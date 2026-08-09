import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Calendar, Circle, Crown, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { adminMembers, adminActivities, adminCircles, adminHosts, adminReports } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

const categories = [
  { key: 'members', label: 'Members', icon: Users, data: adminMembers, searchFields: ['name', 'email'] },
  { key: 'activities', label: 'Activities', icon: Calendar, data: adminActivities, searchFields: ['title', 'host'] },
  { key: 'circles', label: 'Circles', icon: Circle, data: adminCircles, searchFields: ['name', 'host'] },
  { key: 'hosts', label: 'Hosts', icon: Crown, data: adminHosts, searchFields: ['name'] },
  { key: 'reports', label: 'Reports', icon: Flag, data: adminReports, searchFields: ['reporter', 'target', 'reason'] },
];

export default function GlobalSearch() {
  const { t } = useLocalization();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const q = query.toLowerCase();
    const filtered = {};
    let total = 0;
    categories.forEach((cat) => {
      filtered[cat.key] = cat.data.filter((item) =>
        cat.searchFields.some((field) => String(item[field]).toLowerCase().includes(q))
      );
      total += filtered[cat.key].length;
    });
    filtered._total = total;
    setResults(filtered);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={t('admin.search_members_activities')}
          className="pl-9 h-9 bg-muted/40 border-0 focus-visible:ring-1"
        />
      </div>
      {showResults && results && (
        <div className="absolute top-full mt-2 w-full sm:w-96 rounded-xl border bg-popover shadow-lg z-50 max-h-96 overflow-y-auto">
          {results._total === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No results for "{query}"</div>
          ) : (
            <div className="p-2">
              {categories.map((cat) => {
                const items = results[cat.key];
                if (!items || items.length === 0) return null;
                const Icon = cat.icon;
                return (
                  <div key={cat.key} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
                    </div>
                    {items.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-default flex items-center gap-2"
                      >
                        <span className="text-sm font-medium truncate">{item.name || item.title || item.reporter}</span>
                        <span className="text-xs text-muted-foreground truncate ml-auto">{item.email || item.host || item.reason}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}