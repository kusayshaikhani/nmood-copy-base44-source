import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, BookOpen, Bell, User, Users, Settings, Shield, HelpCircle, Info, X } from 'lucide-react';
import Logo from './Logo';

const primaryNav = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Discover', icon: Compass, path: '/explore' },
  { label: 'Circles', icon: Users, path: '/circles' },
  { label: 'Journal', icon: BookOpen, path: '/journal' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Profile', icon: User, path: '/profile' },
];

const secondaryNav = [
  { label: 'Settings', icon: Settings, path: '/settings' },
  { label: 'Privacy', icon: Shield, path: '/privacy' },
  { label: 'Help', icon: HelpCircle, path: '/help' },
  { label: 'About', icon: Info, path: '/about' },
];

export default function MobileMenuOverlay({ open, onClose }) {
  const location = useLocation();
  if (!open) return null;

  const renderLink = (item) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-default ${
          isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
        }`}
      >
        <Icon className="w-5 h-5" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-72 max-w-[80vw] bg-sidebar-background h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between h-16 px-5 border-b border-sidebar-border">
          <Logo />
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {primaryNav.map(renderLink)}
          <div className="pt-6 pb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">System</div>
          {secondaryNav.map(renderLink)}
        </nav>
      </div>
    </div>
  );
}