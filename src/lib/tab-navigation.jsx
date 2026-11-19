import React, { createContext, useContext, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';

/**
 * Tab stack preservation — each main tab retains its own independent navigation
 * history stack, scroll position, and page state. Tapping a different tab
 * restores its previous sub-page and scroll position; tapping the active tab
 * resets to root and scrolls to top. Mirrors native iOS/Android tab bar behavior
 * inside a single-page React Router app.
 */

const TabNavigationContext = createContext(null);

const TAB_ROOTS = ['/', '/circles', '/nmood', '/likes', '/experiences', '/messages'];

export function getTabForPath(pathname) {
  if (pathname === '/') return '/';
  if (pathname.startsWith('/pal/') || pathname === '/pals' || pathname === '/people') return '/';
  for (const root of TAB_ROOTS) {
    if (root !== '/' && (pathname === root || pathname.startsWith(root + '/'))) return root;
  }
  // Any path not matching another tab root belongs to the Home tab,
  // so sub-pages like /saved, /profile, /settings, /experience/:id
  // are preserved when switching tabs and returning to Home.
  return '/';
}

export function TabNavigationProvider({ children, scrollRef }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const tabStacks = useRef(new Map());        // tab -> string[] (history stack, last = current)
  const scrollPositions = useRef(new Map());  // pathname -> { x, y }
  const currentTabRef = useRef(null);
  const pendingScrollRestore = useRef(null);
  const cancelScrollRestore = useRef(() => {});

  const currentTab = getTabForPath(location.pathname);

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

  // AppShell owns the scrolling element. Reset ordinary navigation and restore
  // tab/back navigation; Notifications always opens at its header.
  useLayoutEffect(() => {
    const element = scrollRef?.current;
    if (!element) return;
    const path = location.pathname;
    const restore = pendingScrollRestore.current === path || navigationType === 'POP';
    const saved = restore ? scrollPositions.current.get(location.key) || scrollPositions.current.get(path + location.search) : null;
    pendingScrollRestore.current = null;
    const apply = () => {
      element.scrollTop = saved?.y || 0;
      element.scrollLeft = saved?.x || 0;
    };
    apply();
    // Retry after the outlet paints, cancelling stale work on rapid navigation.
    let secondFrame;
    const frame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(apply); });
    cancelScrollRestore.current = () => {
      cancelAnimationFrame(frame);
      if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
    };
    const save = () => {const position={x:element.scrollLeft,y:element.scrollTop};scrollPositions.current.set(location.key,position);scrollPositions.current.set(path + location.search,position);};
    element.addEventListener('scroll', save, { passive: true });
    return () => {
      save();
      cancelScrollRestore.current();
      element.removeEventListener('scroll', save);
    };
  }, [location.key, location.pathname, location.search, navigationType, scrollRef]);

  const handleTabClick = useCallback((tabPath) => {
    cancelScrollRestore.current();
    const isActive = currentTabRef.current === tabPath;

    // Persist current scroll position before navigating.
    scrollPositions.current.set(location.pathname, {
      x: scrollRef?.current?.scrollLeft || 0,
      y: scrollRef?.current?.scrollTop || 0,
    });

    if (isActive) {
      // Tapping the active tab: if not at root, reset to root; if already at root, scroll to top.
      if (location.pathname !== tabPath) {
        tabStacks.current.set(tabPath, [tabPath]);
        scrollPositions.current.delete(tabPath);
        pendingScrollRestore.current = tabPath;
        navigate(tabPath);
      } else {
        if (scrollRef?.current) scrollRef.current.scrollTop = 0;
      }
    } else {
      // Tapping a different tab: restore to the top of its history stack.
      const stack = tabStacks.current.get(tabPath) || [tabPath];
      const targetPath = stack[stack.length - 1] || tabPath;
      pendingScrollRestore.current = targetPath;
      navigate(targetPath);
    }
  }, [location.pathname, navigate, scrollRef]);

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
