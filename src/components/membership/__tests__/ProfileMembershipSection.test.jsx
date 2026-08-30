import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfileMembershipSection from '@/components/membership/ProfileMembershipSection';

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));
vi.mock('@/lib/launch-mode', () => ({
  isFounderAccessEnabled: () => false,
}));

const mockUseMembershipAccess = vi.fn();
vi.mock('@/components/membership/MembershipProvider', () => ({
  useMembershipAccess: () => mockUseMembershipAccess(),
}));

afterEach(() => {
  cleanup();
  mockUseMembershipAccess.mockReset();
});

function renderSection() {
  return render(
    <MemoryRouter>
      <ProfileMembershipSection />
    </MemoryRouter>
  );
}

describe('ProfileMembershipSection — subscription state (source of truth: membership from useMembershipAccess)', () => {
  it('non-premium: shows "membership.upgrade" and never a Manage button', () => {
    mockUseMembershipAccess.mockReturnValue({
      isPremium: false,
      membership: { type: 'explorer', status: 'active' },
      cancel: vi.fn(),
    });
    const { getByText, queryByText } = renderSection();

    expect(getByText('membership.upgrade')).toBeTruthy();
    expect(queryByText('membership.manage')).toBeNull();
  });

  it('active premium: shows the premium label, plan name, renewal date, and a Manage button — no Upgrade button', () => {
    mockUseMembershipAccess.mockReturnValue({
      isPremium: true,
      membership: { type: 'premium', status: 'active', plan: 'annual', renewal_date: '2026-12-01T00:00:00.000Z' },
      cancel: vi.fn(),
    });
    const { getByText, queryByText, container } = renderSection();

    expect(getByText('membership.premium_member_label')).toBeTruthy();
    expect(getByText('membership.manage')).toBeTruthy();
    expect(queryByText('membership.upgrade')).toBeNull();
    expect(container.textContent).toContain('12 Months');
    expect(container.textContent).toContain('Renews');
  });

  it('Manage membership calls the real native "manage subscription" action, not a dead in-app route', () => {
    const cancel = vi.fn();
    mockUseMembershipAccess.mockReturnValue({
      isPremium: true,
      membership: { type: 'premium', status: 'active', plan: 'monthly' },
      cancel,
    });
    const { getByText } = renderSection();

    fireEvent.click(getByText('membership.manage'));
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
