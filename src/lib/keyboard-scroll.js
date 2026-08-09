// Global keyboard scroll-into-view handler for native mobile builds.
//
// On iOS WKWebView, when the soft keyboard opens it overlays content without
// resizing the layout viewport. Focused inputs at the bottom of a form or
// sheet can be hidden behind the keyboard with no way to scroll to them.
// This module listens for focusin events and scrolls the focused element
// into the visible area (above the keyboard) after the keyboard animation
// settles. It also re-adjusts when the visual viewport resizes (e.g. when
// the keyboard's autocomplete bar appears or the keyboard height changes).
//
// On Android, the `interactive-widget=resizes-content` viewport meta tag
// (set in index.html) handles layout resizing; this scroll-into-view is a
// complementary safety net for edge cases.

export function installKeyboardScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let scrollTimer = null;

  const isFocusable = (el) => {
    if (!el || !el.tagName) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  };

  const scrollToFocused = (el) => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const vv = window.visualViewport;
      if (!vv) return;
      const rect = el.getBoundingClientRect();
      // Only scroll if the element's bottom is below the visual viewport
      // (i.e. covered by the keyboard). A 20px buffer avoids edge jitter.
      if (rect.bottom > vv.height - 20) {
        el.scrollIntoView({ block: 'center' });
      }
    }, 300);
  };

  // focusin bubbles (unlike focus), so a single document listener covers
  // all inputs including those rendered inside portals (sheets, dialogs).
  document.addEventListener('focusin', (e) => {
    if (isFocusable(e.target)) scrollToFocused(e.target);
  }, true);

  // Re-adjust when the visual viewport changes size (keyboard open/close,
  // autocomplete bar, orientation change while focused).
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const el = document.activeElement;
      if (isFocusable(el)) scrollToFocused(el);
    });
  }
}