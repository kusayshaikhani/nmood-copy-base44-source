import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PremiumStepHostType from '@/components/host/wizard/premium/PremiumStepHostType';

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

afterEach(() => {
  cleanup();
  mockNavigate.mockClear();
});

// Create Experience's pre-step (host type picker) — reached directly when
// there is no pre-selected hostType (Create Circle instead redirects
// straight past this into the shared wizard, see CreateCircle.test.jsx).
describe('PremiumStepHostType back arrow', () => {
  function renderScreen() {
    return render(
      <MemoryRouter initialEntries={['/host/create']}>
        <PremiumStepHostType onSelect={() => {}} />
      </MemoryRouter>
    );
  }

  it('navigates to the explicit fallback (/host) exactly once for a rapid double-tap', () => {
    const { getByLabelText } = renderScreen();
    const backButton = getByLabelText('common.back');

    fireEvent.click(backButton);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/host', { replace: true });
  });

  it('never calls navigate(-1) or window.history.back() (no in-app history to rely on)', () => {
    const historyBackSpy = vi.spyOn(window.history, 'back');
    const { getByLabelText } = renderScreen();

    fireEvent.click(getByLabelText('common.back'));

    expect(mockNavigate).not.toHaveBeenCalledWith(-1);
    expect(historyBackSpy).not.toHaveBeenCalled();
    historyBackSpy.mockRestore();
  });
});
