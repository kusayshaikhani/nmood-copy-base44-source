import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Membership from '@/pages/Membership';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  };
});

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));

vi.mock('@/components/membership/MembershipProvider', () => ({
  useMembershipAccess: () => ({
    isPremium: true,
    loading: false,
    cancel: vi.fn(),
    restore: vi.fn(),
    showUpgrade: vi.fn(),
    membership: { plan: 'annual', payment_provider: 'apple', auto_renew: true },
  }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/membership-engine', () => ({
  isLegacyMembership: () => false,
}));

vi.mock('@/lib/membership-analytics', () => ({
  trackMembershipEvent: vi.fn(),
  MEMBERSHIP_EVENTS: { VIEWED: 'VIEWED', UPGRADE_CLICKED: 'UPGRADE_CLICKED' },
}));

vi.mock('@/lib/product-analytics', () => ({
  trackProductEvent: vi.fn(),
  PRODUCT_EVENTS: { MEMBERSHIP_SCREEN_VIEWED: 'MEMBERSHIP_SCREEN_VIEWED' },
}));

vi.mock('@/components/membership/premium/PremiumHero', () => ({ default: () => null }));
vi.mock('@/components/membership/premium/PremiumMembershipCard', () => ({ default: ({ onPrimary }) => <button onClick={onPrimary}>premium card</button> }));
vi.mock('@/components/membership/premium/PremiumBenefitsGrid', () => ({ default: () => null }));
vi.mock('@/components/membership/premium/PremiumComparison', () => ({ default: () => null }));
vi.mock('@/components/membership/premium/PremiumFaq', () => ({ default: () => null }));
vi.mock('@/components/membership/premium/PremiumStickyCta', () => ({ default: () => <div data-testid="premium-sticky-cta">sticky</div> }));
vi.mock('@/components/membership/MembershipSlogan', () => ({ default: () => null }));
vi.mock('@/components/experience/SectionReveal', () => ({ default: ({ children }) => <>{children}</> }));

afterEach(() => {
  cleanup();
  mockNavigate.mockReset();
});

describe('Membership page — premium layout', () => {
  it('does not render the sticky CTA when the premium manage action is already visible', () => {
    const { queryByTestId } = render(<Membership />);
    expect(queryByTestId('premium-sticky-cta')).toBeNull();
  });
});
