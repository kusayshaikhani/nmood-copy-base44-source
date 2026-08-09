import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { useMissionControlAccess } from '@/hooks/useMissionControlAccess';

/**
 * FM-007 — One-tap Mission Control access for authorized administrators.
 *
 * A floating action button rendered throughout the member application. It is
 * completely invisible to regular members (gated by the centralized
 * `useMissionControlAccess` authorization hook) and does not replace or alter
 * the bottom navigation. Selecting it opens the Executive Command Center
 * directly. Context is preserved — administrators move between the member
 * experience and Mission Control without logging out.
 *
 * Responsive + safe-area aware. Temporarily hidden only while an editing
 * workflow (an open shadcn Sheet/Dialog editor) is active, so it never
 * competes with unsaved-edit surfaces.
 */
function useEditorOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const query = '[role="dialog"][data-state="open"]';
    const sync = () => setOpen(!!document.querySelector(query));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-state', 'role'] });
    return () => observer.disconnect();
  }, []);
  return open;
}

export default function MissionControlFab() {
  const { allowed, loading } = useMissionControlAccess();
  const navigate = useNavigate();
  const editorOpen = useEditorOpen();

  if (loading || !allowed || editorOpen) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/mission-control')}
      aria-label="Mission Control"
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] sm:right-[calc(1.5rem+env(safe-area-inset-right))] z-30 group"
    >
      <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-default hover-lift">
        <Rocket className="w-6 h-6" />
      </span>
      <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 hidden sm:block opacity-0 group-hover:opacity-100 transition-default bg-popover text-popover-foreground text-xs font-medium px-2.5 py-1.5 rounded-lg shadow whitespace-nowrap">
        Mission Control
      </span>
    </button>
  );
}