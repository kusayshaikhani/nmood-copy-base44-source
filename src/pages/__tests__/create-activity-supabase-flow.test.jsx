import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import CreateActivity from '@/pages/CreateActivity';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const mockCan = vi.fn(() => true);
const mockShowUpgrade = vi.fn();
const mockEmitActivityChange = vi.fn();
const mockInvalidateExperienceCache = vi.fn();
const mockInvalidateCircleCache = vi.fn();

const createCircleMock = vi.fn();
const createExperienceMock = vi.fn();
const getOwnMemberMock = vi.fn();

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));

vi.mock('@/components/membership/MembershipProvider', () => ({
  useMembershipAccess: () => ({
    can: mockCan,
    showUpgrade: mockShowUpgrade,
  }),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1', email: 'user@example.com', full_name: 'Test User', interests: ['Wellness'] } }),
}));

vi.mock('@/lib/member-profile', () => ({
  getOwnMember: (...args) => getOwnMemberMock(...args),
}));

vi.mock('@/lib/activity-store', () => ({
  emitActivityChange: (...args) => mockEmitActivityChange(...args),
  useActivityRefresh: () => 'refresh-1',
}));

vi.mock('@/lib/discover-store', () => ({
  invalidateExperienceCache: (...args) => mockInvalidateExperienceCache(...args),
}));

vi.mock('@/lib/circle-store', () => ({
  invalidateCircleCache: (...args) => mockInvalidateCircleCache(...args),
}));

vi.mock('@/lib/permission-engine', () => ({ FEATURES: { CREATE_CIRCLE: 'create_circle', CREATE_EXPERIENCE: 'create_experience' } }));
vi.mock('@/lib/product-analytics', () => ({ trackProductEvent: vi.fn(), PRODUCT_EVENTS: { CIRCLE_CREATED: 'CIRCLE_CREATED', EXPERIENCE_CREATED: 'EXPERIENCE_CREATED' } }));
vi.mock('@/lib/membership-analytics', () => ({ trackMembershipEvent: vi.fn(), MEMBERSHIP_EVENTS: { LIMIT_REACHED: 'LIMIT_REACHED' } }));
vi.mock('@/lib/performance-monitor', () => ({ startTimer: () => ({ end: vi.fn() }) }));
vi.mock('@/api/contentRecords', () => ({
  createCircle: (...args) => createCircleMock(...args),
  createExperience: (...args) => createExperienceMock(...args),
}));

vi.mock('@/components/map/MapLibreLocationPicker', () => ({
  default: () => <div data-testid="location-map" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.removeItem('hostCreationDraft');
  getOwnMemberMock.mockResolvedValue({ display_name: 'Test User', photo_url: '' });
  createCircleMock.mockResolvedValue({ id: 'circle-1' });
  createExperienceMock.mockResolvedValue({ id: 'exp-1' });
});

afterEach(cleanup);

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderCreateActivity(hostType) {
  render(
    <MemoryRouter>
      <CreateActivity hostType={hostType} />
      <LocationProbe />
    </MemoryRouter>
  );
}

const next = () => fireEvent.click(screen.getByRole('button', { name: 'hosting.create.next' }));

async function advanceFromCoverToBasics() {
  fireEvent.click(screen.getAllByRole('button', { pressed: false })[0]);
  next();
  expect(await screen.findByText('create.premium.basics_title')).toBeTruthy();
}

function fillBasics({ title, category, description }) {
  const [titleInput] = screen.getAllByRole('textbox');
  fireEvent.change(titleInput, { target: { value: title } });
  fireEvent.click(screen.getByRole('button', { name: category }));
  fireEvent.change(screen.getAllByRole('textbox').at(-1), { target: { value: description } });
}

async function advanceCircleToPreview() {
  await advanceFromCoverToBasics();
  fillBasics({ title: 'Neighborhood Book Club', category: 'Books', description: 'Friendly reads and conversation.' });
  next();
  expect(await screen.findByText('create.premium.location_title')).toBeTruthy();
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Kite Beach' } });
  next();
  expect(await screen.findByText('hosting.wizard.step_capacity')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Number of attendees'), { target: { value: '8' } });
  fireEvent.blur(screen.getByLabelText('Number of attendees'));
  next();
  expect(await screen.findByText('create.circle.rules_title')).toBeTruthy();
  next();
  expect(await screen.findByText('hosting.step_preview.title')).toBeTruthy();
}

async function advanceExperienceToPreview() {
  await advanceFromCoverToBasics();
  fillBasics({ title: 'Sunset Walk', category: 'Wellness', description: 'Evening walk by the coast.' });
  next();
  expect(await screen.findByText('create.premium.timelocation_title')).toBeTruthy();
  fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-20' } });
  fireEvent.change(document.querySelector('input[type="time"]'), { target: { value: '18:00' } });
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Jumeirah Beach' } });
  next();
  expect(await screen.findByText('hosting.wizard.step_capacity')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Number of attendees'), { target: { value: '12' } });
  fireEvent.blur(screen.getByLabelText('Number of attendees'));
  next();
  expect(await screen.findByText('hosting.wizard.step_details')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Free' }));
  next();
  expect(await screen.findByText('hosting.step_preview.title')).toBeTruthy();
}

describe('CreateActivity Supabase write flow', () => {
  it('shows a successful Circle write as a rendered result without restart', async () => {
    renderCreateActivity('circle');

    await advanceCircleToPreview();
    fireEvent.click(screen.getByRole('button', { name: 'hosting.create.create_circle' }));

    await waitFor(() => expect(createCircleMock).toHaveBeenCalledTimes(1));
    expect(mockInvalidateCircleCache).toHaveBeenCalled();
    expect(mockEmitActivityChange).toHaveBeenCalled();
    expect(screen.getByText('Your Circle is Ready!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open Circle' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/circle/circle-1');
  });

  it('shows a successful Experience write as a rendered result without restart', async () => {
    renderCreateActivity('experience');

    await advanceExperienceToPreview();
    fireEvent.click(screen.getByRole('button', { name: 'hosting.create.publish_experience' }));

    await waitFor(() => expect(createExperienceMock).toHaveBeenCalledTimes(1));
    expect(mockInvalidateExperienceCache).toHaveBeenCalled();
    expect(mockEmitActivityChange).toHaveBeenCalled();
    expect(screen.getByText('Your Experience is Live!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'View Experience' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/experience/exp-1');
  });

  it('keeps the user on the form and shows a clear error when Supabase insert fails', async () => {
    createCircleMock.mockRejectedValueOnce(new Error('Supabase insert failed'));
    renderCreateActivity('circle');

    await advanceCircleToPreview();
    fireEvent.click(screen.getByRole('button', { name: 'hosting.create.create_circle' }));

    await waitFor(() => expect(screen.getByText('Supabase insert failed')).toBeTruthy());
    expect(screen.getByText('hosting.step_preview.title')).toBeTruthy();
  });
});
