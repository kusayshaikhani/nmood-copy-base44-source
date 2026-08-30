import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Communities from '@/pages/Communities';

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));
vi.mock('@/components/communities/CircleFilterSheet', () => ({
  default: () => null,
}));
// Covered by its own suite; stubbed here so this file stays focused on circles.
vi.mock('@/components/membership/UpgradeMembershipCTA', () => ({ default: () => null }));

let mockCircles = [];
vi.mock('@/lib/circle-store', () => ({
  useMergedCircles: () => mockCircles,
}));

afterEach(() => {
  cleanup();
  mockCircles = [];
});

// Circles screen must only ever show real Supabase-backed circles (from the
// same useMergedCircles source Home's Popular Circles uses) — never the
// removed PREVIEW_CIRCLES demo set ("Entrepreneurs", "Photography",
// "Fitness", "Coffee Lovers", "Travel", "Gaming").
describe('Communities (Circles tab) — real records only', () => {
  it('shows a polished empty state with Create/Explore actions when there are no real circles', () => {
    mockCircles = [];
    const { getByText, queryByText, container } = render(
      <MemoryRouter><Communities /></MemoryRouter>
    );

    expect(getByText('No circles yet')).toBeTruthy();
    expect(getByText('Create a circle')).toBeTruthy();
    expect(getByText('Explore')).toBeTruthy();
    expect(container.innerHTML).toContain('text-white');
    expect(queryByText('Entrepreneurs')).toBeNull();
    expect(queryByText('Coffee Lovers')).toBeNull();
    expect(queryByText('Gaming')).toBeNull();
  });

  it('renders real circles when they exist, never demo content', () => {
    mockCircles = [
      { id: 'real-1', name: 'Real Padel Group', member_count: 4, category: 'Sports' },
    ];
    const { getByText, queryByText } = render(
      <MemoryRouter><Communities /></MemoryRouter>
    );

    expect(getByText('Real Padel Group')).toBeTruthy();
    expect(queryByText('No circles yet')).toBeNull();
    expect(queryByText('Photography')).toBeNull();
  });
});
