import React from 'react';
import { Coffee, UtensilsCrossed, Dumbbell, Users, Film, Camera, Heart, GraduationCap, Palette, Gamepad2, Music, Trees } from 'lucide-react';

const categories = [
  { icon: Coffee, label: 'Coffee', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' },
  { icon: UtensilsCrossed, label: 'Food', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' },
  { icon: Dumbbell, label: 'Sports', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' },
  { icon: Users, label: 'Networking', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
  { icon: Film, label: 'Movies', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' },
  { icon: Camera, label: 'Photography', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' },
  { icon: Heart, label: 'Wellness', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' },
  { icon: GraduationCap, label: 'Learning', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { icon: Palette, label: 'Arts', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300' },
  { icon: Gamepad2, label: 'Gaming', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { icon: Music, label: 'Music', color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300' },
  { icon: Trees, label: 'Nature', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' },
];

export default function CategoryGrid() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Discover by Category</h2>
      <div className="grid grid-cols-4 gap-2.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.label}
              type="button"
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border hover-lift"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}