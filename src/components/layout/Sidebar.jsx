import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, BookOpen, Bell, User, Users, Settings, Shield, HelpCircle, Info, ChevronLeft } from 'lucide-react';
import Logo from './Logo';

const primaryNav = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Discover', icon: Compass, path: '/explore' },
  { label: 'Communities', icon: Users, path: '/communities' },
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

function NavItem({ item, collapsed }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-default ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`hidden md:flex flex-col h-screen sticky top-0 border-r border-sidebar-border bg-sidebar-background transition-default ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className={`flex items-center h-16 border-b border-sidebar-border ${collapsed ? 'justify-center' : 'px-5'}`}>
        <Logo collapsed={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        <div className="space-y-1">
          {primaryNav.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </div>

        <div className="mt-8 mb-2">
          {!collapsed && <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">System</p>}
        </div>
        <div className="space-y-1">
          {secondaryNav.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={onToggle}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-sidebar-accent transition-default w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <ChevronLeft className={`w-4 h-4 flex-shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}