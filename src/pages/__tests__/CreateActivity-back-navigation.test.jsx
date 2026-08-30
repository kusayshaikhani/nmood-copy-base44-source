import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { useState } from 'react';
import { useGuardedCallback } from '@/lib/use-guarded-back';

// Mirrors CreateActivity.jsx's handleBack exactly (step > 0 pops one wizard
// step in-page; step 0 lands on the explicit '/host' fallback — never
// navigate(-1)/window.history.back()). CreateActivity itself pulls in many
// unrelated data dependencies (base44, membership, analytics); this focused
// harness exercises the identical, extracted back-arrow logic it and
// PremiumStepHostType.jsx both use via useGuardedCallback.
function ExperienceWizardBackArrowHarness({ initialStep, navigate }) {
  const [step, setStep] = useState(initialStep);
  const rawHandleBack = () => {
    if (step > 0) {
      setStep((s) => Math.max(0, s - 1));
      return;
    }
    navigate('/host', { replace: true });
  };
  const handleBack = useGuardedCallback(rawHandleBack, step);
  return (
    <div>
      <span data-testid="step">{step}</span>
      <button type="button" aria-label="Back" onClick={handleBack}>Back</button>
    </div>
  );
}

afterEach(cleanup);

describe('Create Experience wizard back arrow', () => {
  it('pops one in-page step per tap, ignoring a same-tick double-tap', () => {
    const navigate = vi.fn();
    const { getByLabelText, getByTestId } = render(
      <ExperienceWizardBackArrowHarness initialStep={2} navigate={navigate} />
    );
    const backButton = getByLabelText('Back');

    // Both taps dispatched within one act() batch — simulates two touch
    // events landing before React has a chance to flush the step update
    // and release the guard, unlike two separate fireEvent calls.
    act(() => {
      backButton.click();
      backButton.click();
    });

    expect(getByTestId('step').textContent).toBe('1');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('at step 0, navigates to the explicit fallback exactly once for a double-tap (empty-history case)', () => {
    const navigate = vi.fn();
    const { getByLabelText } = render(
      <ExperienceWizardBackArrowHarness initialStep={0} navigate={navigate} />
    );
    const backButton = getByLabelText('Back');

    fireEvent.click(backButton);
    fireEvent.click(backButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/host', { replace: true });
  });

  it('releases the guard after the step actually changes, allowing the next tap', () => {
    const navigate = vi.fn();
    const { getByLabelText, getByTestId } = render(
      <ExperienceWizardBackArrowHarness initialStep={1} navigate={navigate} />
    );
    const backButton = getByLabelText('Back');

    fireEvent.click(backButton);
    expect(getByTestId('step').textContent).toBe('0');

    // A later, separate tap (after the step changed) must still work and
    // land on the fallback rather than being silently swallowed forever.
    fireEvent.click(backButton);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/host', { replace: true });
  });
});
