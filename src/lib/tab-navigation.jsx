import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Tab stack preservation — each main tab retains its own independent navigation
 * history stack, scroll position, and page state. Tapping a different tab
 * restores its previous sub-page and scroll position; tapping the active tab
 * resets to root and scrolls to top. Mirrors native iOS/Android tab bar behavior
 * inside a single-page React Router app.
 */

const TabNavigationContext = createContext(null);

const TAB_ROOTS = ['/', '/explore', '/nmood', '/communities', '/messages'];

export function getTabForPath(pathname) {
  if (pathname === '/') return '/';
  for (const root of TAB_ROOTS) {
    if (root !== '/' && (pathname === root || pathname.startsWith(root + '/'))) return root;
  }
  // Any path not matching another tab root belongs to the Home tab,
  // so sub-pages like /saved, /profile, /settings, /experience/:id
  // are preserved when switching tabs and returning to Home.
  return '/';
}

export function TabNavigationProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tabStacks = useRef(new Map());        // tab -> string[] (history stack, last = current)
  const scrollPositions = useRef(new Map());  // pathname -> { x, y }
  const currentTabRef = useRef(null);
  const pendingScrollRestore = useRef(null);

  const currentTab = getTabForPath(location.pathname);

  // Save scroll position for the current path before it changes.
  useEffect(() => {
    const save = () => {
      scrollPositions.current.set(location.pathname, {
        x: window.scrollX,
        y: window.scrollY,
      });
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      save();
      window.removeEventListener('scroll', save);
    };
  }, [location.pathname]);

  // Track the current tab and manage its history stack.
  useEffect(() => {
    if (!currentTab) return;
    const stack = tabStacks.current.get(currentTab) || [];
    const top = stack[stack.length - 1];

    if (top !== location.pathname) {
      if (location.pathname === currentTab) {
        // Navigated to tab root — reset stack.
        tabStacks.current.set(currentTab, [currentTab]);
      } else if (top && (location.pathname.startsWith(currentTab + '/') || location.pathname.startsWith(currentTab))) {
        // Navigating deeper within the tab — push.
        stack.push(location.pathname);
        tabStacks.current.set(currentTab, [...stack]);
      } else {
        // Fresh entry for this tab.
        tabStacks.current.set(currentTab, [location.pathname]);
      }
    }
    currentTabRef.current = currentTab;
  }, [location.pathname, currentTab]);

  // Restore scroll position after a tab switch navigation completes.
  useEffect(() => {
    if (pendingScrollRestore.current === null) return;
    const target = pendingScrollRestore.current;
    pendingScrollRestore.current = null;
    // Double rAF ensures the new page has painted before we scroll.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const saved = scrollPositions.current.get(target);
        if (saved && saved.y > 0) {
          window.scrollTo({ top: saved.y, left: saved.x || 0, behavior: 'auto' });
        } else {
          window.scrollTo(0, 0);
        }
      })
    );
  }, [location.pathname]);

  const handleTabClick = useCallback((tabPath) => {
    const isActive = currentTabRef.current === tabPath;

    // Persist current scroll position before navigating.
    scrollPositions.current.set(location.pathname, {
      x: window.scrollX,
      y: window.scrollY,
    });

    if (isActive) {
      // Tapping the active tab: if not at root, reset to root; if already at root, scroll to top.
      if (location.pathname !== tabPath) {
        tabStacks.current.set(tabPath, [tabPath]);
        pendingScrollRestore.current = tabPath;
        navigate(tabPath);
      } else {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    } else {
      // Tapping a different tab: restore to the top of its history stack.
      const stack = tabStacks.current.get(tabPath) || [tabPath];
      const targetPath = stack[stack.length - 1] || tabPath;
      pendingScrollRestore.current = targetPath;
      navigate(targetPath);
    }
  }, [location.pathname, navigate]);

  return (
    <TabNavigationContext.Provider value={{ handleTabClick, currentTab }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const ctx = useContext(TabNavigationContext);
  if (!ctx) throw new Error('useTabNavigation must be used within TabNavigationProvider');
  return ctx;
}