import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateCircle from '@/pages/CreateCircle';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

afterEach(() => {
  cleanup();
  mockNavigate.mockClear();
});

// Create Circle has no UI of its own — it redirects straight into
// CreateActivity's shared wizard. Even with a single history entry (no
// previous in-app route to pop to, e.g. a deep link straight into this
// screen) it must land safely with an explicit destination, never -1.
describe('CreateCircle entry redirect', () => {
  it('replaces into the shared wizard with hostType=circle, even with an empty history stack', () => {
    render(
      <MemoryRouter initialEntries={['/host/create-circle']}>
        <CreateCircle />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      '/host/create',
      { state: { hostType: 'circle' }, replace: true }
    );
  });

  it('never relies on navigate(-1) or window.history.back()', () => {
    const historyBackSpy = vi.spyOn(window.history, 'back');

    render(
      <MemoryRouter initialEntries={['/host/create-circle']}>
        <CreateCircle />
      </MemoryRouter>
    );

    expect(mockNavigate).not.toHaveBeenCalledWith(-1);
    expect(historyBackSpy).not.toHaveBeenCalled();
    historyBackSpy.mockRestore();
  });
});
