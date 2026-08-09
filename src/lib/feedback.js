// DP-001 — Standardized user feedback for the whole app.
// One entry point for success + error toasts: consistent copy, haptic, and
// timing everywhere. Use `feedback.success('circleJoined')` or
// `feedback.error(err)` instead of ad-hoc toast() calls.
import { toast } from '@/components/ui/use-toast';
import { SUCCESS_COPY, ERROR_COPY, friendlyError } from '@/lib/copy';
import { haptic } from '@/lib/haptics';

export const feedback = {
  success(key, overrides = {}) {
    const copy = SUCCESS_COPY[key] || { title: 'Done' };
    haptic('success');
    toast({ title: copy.title, description: copy.description, ...overrides });
  },
  error(err, overrides = {}) {
    const copy = friendlyError(err);
    haptic('error');
    toast({ title: copy.title, description: copy.description, ...overrides });
  },
  message(title, description, overrides = {}) {
    haptic('light');
    toast({ title, description, ...overrides });
  },
};

export const FEEDBACK_KEYS = Object.keys(SUCCESS_COPY);