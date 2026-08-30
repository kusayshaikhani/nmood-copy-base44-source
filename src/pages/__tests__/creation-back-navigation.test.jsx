import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useOriginState } from '@/lib/safe-navigation';
import CreateActivity from '@/pages/CreateActivity';
import CreateCircle from '@/pages/CreateCircle';

// Lightweight stand-ins for the real parent screens, each entering a creation
// flow exactly the way the app does: a plain push carrying the recorded origin.
function EntryScreen({ label, to }) {
  const navigate = useNavigate();
  const originState = useOriginState();
  return (
    <div>
      <h1>{label}</h1>
      <button type="button" onClick={() => navigate(to, { state: originState() })}>go</button>
    </div>
  );
}

function renderApp(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<EntryScreen label="Home screen" to="/host/create-circle" />} />
        <Route path="/communities" element={<EntryScreen label="Circles screen" to="/host/create-circle" />} />
        <Route path="/explore" element={<EntryScreen label="Discover screen" to="/host/create" />} />
        <Route path="/host/create" element={<CreateActivity />} />
        <Route path="/host/create-circle" element={<CreateCircle />} />
      </Routes>
    </MemoryRouter>
  );
}

// --- Keep the wizard renderable in jsdom: only its navigation contract is
// under test, so data/analytics/step UI are stubbed out. ---
vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));
vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/lib/member-profile', () => ({ getOwnMember: async () => null }));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'u@example.com', full_name: 'U' } }),
}));
vi.mock('@/components/membership/MembershipProvider', () => ({
  useMembershipAccess: () => ({ can: () => true, showUpgrade: vi.fn() }),
}));
vi.mock('@/lib/membership-analytics', () => ({
  trackMembershipEvent: vi.fn(), MEMBERSHIP_EVENTS: {},
}));
vi.mock('@/lib/product-analytics', () => ({
  trackProductEvent: vi.fn(), PRODUCT_EVENTS: {},
}));
vi.mock('@/lib/performance-monitor', () => ({ startTimer: () => ({ end: vi.fn() }) }));
vi.mock('@/lib/activity-store', () => ({ emitActivityChange: vi.fn() }));
vi.mock('@/lib/discover-store', () => ({ invalidateExperienceCache: vi.fn() }));

vi.mock('@/components/host/wizard/premium/PremiumStepCover', () => ({ default: () => <div data-testid="step-cover" /> }));
vi.mock('@/components/host/wizard/premium/PremiumStepBasics', () => ({ default: () => <div data-testid="step-basics" /> }));
vi.mock('@/components/host/wizard/premium/PremiumStepTimeLocation', () => ({ default: () => <div data-testid="step-timeloc" /> }));
vi.mock('@/components/host/wizard/premium/PremiumStepCapacity', () => ({ default: () => <div data-testid="step-capacity" /> }));
vi.mock('@/components/host/wizard/premium/PremiumStepRequirements', () => ({ default: () => <div data-testid="step-requirements" /> }));
vi.mock('@/components/host/wizard/premium/PremiumStepPreview', () => ({ default: () => <div data-testid="step-preview" /> }));
vi.mock('@/components/host/wizard/CreateSuccess', () => ({ default: () => <div data-testid="create-success" /> }));

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(cleanup);

function enterFlow(utils) {
  fireEvent.click(utils.getByText('go'));
}

describe('Creation flow back arrow — rendered destination after one tap', () => {
  it('Home → Create Circle → Back renders Home', () => {
    const utils = renderApp('/');
    enterFlow(utils);
    expect(utils.getByTestId('step-cover')).toBeTruthy();

    fireEvent.click(utils.getByLabelText('Back'));

    expect(utils.getByText('Home screen')).toBeTruthy();
  });

  it('Circles → Create Circle → Back renders Circles', () => {
    const utils = renderApp('/communities');
    enterFlow(utils);
    expect(utils.getByTestId('step-cover')).toBeTruthy();

    fireEvent.click(utils.getByLabelText('Back'));

    expect(utils.getByText('Circles screen')).toBeTruthy();
  });

  it('Discover → Create Experience → Back renders Discover', () => {
    const utils = renderApp('/explore');
    enterFlow(utils);

    // Create Experience opens on the host-type pre-step.
    fireEvent.click(utils.getByLabelText('common.back'));

    expect(utils.getByText('Discover screen')).toBeTruthy();
  });

  it('wizard step 2 → Back returns to step 1, staying inside the wizard', () => {
    const utils = renderApp('/communities');
    enterFlow(utils);
    expect(utils.getByText(/Step 1 of 6/)).toBeTruthy();

    fireEvent.click(utils.getByText('hosting.create.next'));
    expect(utils.getByText(/Step 2 of 6/)).toBeTruthy();

    fireEvent.click(utils.getByLabelText('Back'));

    expect(utils.getByText(/Step 1 of 6/)).toBeTruthy();
    expect(utils.queryByText('Circles screen')).toBeNull();
  });

  it('direct launch with no recorded origin and no history falls back to the parent screen, never a blank page', () => {
    const utils = renderApp('/host/create-circle');
    expect(utils.getByTestId('step-cover')).toBeTruthy();

    fireEvent.click(utils.getByLabelText('Back'));

    expect(utils.getByText('Circles screen')).toBeTruthy();
  });

  it('a fast double-tap navigates once and does not crash or land anywhere else', () => {
    const utils = renderApp('/communities');
    enterFlow(utils);
    const back = utils.getByLabelText('Back');

    act(() => {
      back.click();
      back.click();
    });

    expect(utils.getByText('Circles screen')).toBeTruthy();
  });
});
