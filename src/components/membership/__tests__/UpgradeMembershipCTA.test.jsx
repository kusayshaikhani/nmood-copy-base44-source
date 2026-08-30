import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import UpgradeMembershipCTA, { isUpgradeCtaSuppressed } from '@/components/membership/UpgradeMembershipCTA';

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));
vi.mock('@/lib/launch-mode', () => ({ isFounderAccessEnabled: () => false }));
vi.mock('@/lib/membership-analytics', () => ({
  trackMembershipEvent: vi.fn(), MEMBERSHIP_EVENTS: {},
}));
vi.mock('@/lib/product-analytics', () => ({
  trackProductEvent: vi.fn(), PRODUCT_EVENTS: {},
}));

const mockUseMembershipAccess = vi.fn();
vi.mock('@/components/membership/MembershipProvider', () => ({
  useMembershipAccess: () => mockUseMembershipAccess(),
}));

afterEach(() => {
  cleanup();
  mockUseMembershipAccess.mockReset();
});

function Paywall() {
  const location = useLocation();
  return <div data-testid="paywall">from:{location.state?.from}</div>;
}

function renderAt(path, props = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<><UpgradeMembershipCTA {...props} /><Routes><Route path="/upgrade" element={<Paywall />} /></Routes></>} />
      </Routes>
    </MemoryRouter>
  );
}

const PRIMARY_SCREENS = ['/', '/explore', '/nmood', '/communities', '/messages', '/profile'];

describe('UpgradeMembershipCTA', () => {
  it('renders on every primary screen for a non-premium member', () => {
    PRIMARY_SCREENS.forEach((path) => {
      mockUseMembershipAccess.mockReturnValue({ isPremium: false, loading: false, cancel: vi.fn() });
      const { queryByTestId } = renderAt(path);
      expect(queryByTestId('upgrade-membership-cta')).toBeTruthy();
      cleanup();
    });
  });

  it('never renders an upgrade CTA for a premium member — shows the Premium badge and Manage Membership instead', () => {
    const cancel = vi.fn();
    mockUseMembershipAccess.mockReturnValue({ isPremium: true, loading: false, cancel });
    const { queryByTestId, getByText } = renderAt('/');

    expect(queryByTestId('upgrade-membership-cta')).toBeNull();
    expect(getByText('membership.cta.premium_badge')).toBeTruthy();

    fireEvent.click(getByText('membership.cta.manage_membership'));
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('renders nothing until the live entitlement has loaded', () => {
    mockUseMembershipAccess.mockReturnValue({ isPremium: false, loading: true, cancel: vi.fn() });
    const { queryByTestId, container } = renderAt('/');

    expect(queryByTestId('upgrade-membership-cta')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('opens the single real paywall route and records the screen it came from', () => {
    mockUseMembershipAccess.mockReturnValue({ isPremium: false, loading: false, cancel: vi.fn() });
    const { getByTestId } = renderAt('/messages');

    fireEvent.click(getByTestId('upgrade-membership-cta'));

    expect(getByTestId('paywall').textContent).toBe('from:/messages');
  });

  it('is suppressed on auth, password reset, paywall/checkout and creation-wizard screens', () => {
    ['/auth', '/login', '/create-account', '/reset-password', '/forgot-password',
      '/upgrade', '/membership', '/host/create', '/host/create-circle'].forEach((path) => {
      expect(isUpgradeCtaSuppressed(path)).toBe(true);

      mockUseMembershipAccess.mockReturnValue({ isPremium: false, loading: false, cancel: vi.fn() });
      const { queryByTestId } = renderAt(path);
      expect(queryByTestId('upgrade-membership-cta')).toBeNull();
      cleanup();
    });
  });

  it('is not suppressed on the primary screens', () => {
    PRIMARY_SCREENS.forEach((path) => expect(isUpgradeCtaSuppressed(path)).toBe(false));
  });
});
