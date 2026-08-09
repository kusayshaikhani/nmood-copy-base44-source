import React from 'react';
import { motion } from 'framer-motion';
import { Route, Target, Calendar, Users, Heart, Mail, Sparkles, Clock, Camera, Settings, Shield } from 'lucide-react';

const sections = [
  { label: 'My Journey', icon: Route, path: '/journey', subtitle: 'Your story' },
  { label: 'My Goals', icon: Target, path: '/goals', subtitle: 'What you\'re improving' },
  { label: 'My Experiences', icon: Calendar, path: '/my-experiences', subtitle: 'Joined & hosted' },
  { label: 'My Pals', icon: Users, path: '/pals', subtitle: 'Your connections' },
  { label: 'Wishlist', icon: Heart, path: '/saved', subtitle: 'Saved experiences' },
  { label: 'Invitations', icon: Mail, path: '/notifications', subtitle: 'Pending invites' },
  { label: 'Hosting', icon: Sparkles, path: '/host', subtitle: 'Your experiences' },
  { label: 'Calendar', icon: Clock, path: '/calendar', subtitle: 'Your schedule' },
  { label: 'Memories', icon: Camera, path: '/journey', subtitle: 'Photos & moments' },
  { label: 'Settings', icon: Settings, path: '/settings', subtitle: 'Preferences' },
  { label: 'Safety Center', icon: Shield, path: '/safety-center', subtitle: 'Trust & safety' },
];

export default function SectionGrid({ navigate }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">My Nmood</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {sections.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.label}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(s.path)}
              type="button"
              className="flex flex-col items-start gap-2 p-3.5 rounded-2xl border border-border bg-card hover-lift text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 w-full">
                <p className="font-semibold text-sm truncate">{s.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{s.subtitle}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}