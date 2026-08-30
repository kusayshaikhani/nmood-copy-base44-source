import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NmoodsHomeSection from '@/components/home/NmoodsHomeSection';

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ member: { interests: [] } }),
}));

afterEach(cleanup);

// No real Nmood-post backend exists (see nmood-recommendations.js) — this
// section must show a polished empty state, never the removed seed/demo
// posts ("Padel partner", "entrepreneur brunch", etc.).
describe('NmoodsHomeSection — no sample/demo content', () => {
  it('renders a polished empty state with Share/Explore actions, not demo posts', () => {
    const { getByText, queryByText } = render(
      <MemoryRouter><NmoodsHomeSection /></MemoryRouter>
    );

    expect(getByText('No Nmoods yet')).toBeTruthy();
    expect(getByText('Share a Nmood')).toBeTruthy();
    expect(getByText('Explore')).toBeTruthy();
    expect(queryByText(/padel/i)).toBeNull();
    expect(queryByText(/entrepreneur brunch/i)).toBeNull();
  });
});
