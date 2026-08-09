import {
  Coffee, Heart, Camera, Dumbbell, UtensilsCrossed, Users, BookOpen,
  Palette, Music, Trees, Gamepad2, Cpu, Sparkles, Globe,
} from 'lucide-react';

/**
 * UI-006 — Premium category icon mapping for communities/circles.
 * Case-insensitive lookup with a tasteful fallback (Sparkles).
 */
const MAP = {
  coffee: Coffee,
  wellness: Heart,
  health: Heart,
  mindfulness: Heart,
  photography: Camera,
  photo: Camera,
  sports: Dumbbell,
  fitness: Dumbbell,
  active: Dumbbell,
  food: UtensilsCrossed,
  dining: UtensilsCrossed,
  foodies: UtensilsCrossed,
  networking: Users,
  business: Users,
  entrepreneurs: Users,
  learning: BookOpen,
  education: BookOpen,
  books: BookOpen,
  'book lovers': BookOpen,
  art: Palette,
  creative: Palette,
  music: Music,
  outdoors: Trees,
  nature: Trees,
  hiking: Trees,
  gaming: Gamepad2,
  technology: Cpu,
  tech: Cpu,
  travel: Globe,
  city: Globe,
};

export function getCategoryIcon(category) {
  if (!category) return Sparkles;
  const key = String(category).toLowerCase().trim();
  return MAP[key] || Sparkles;
}