import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import PremiumStepCapacity from '@/components/host/wizard/premium/PremiumStepCapacity';
import {
  isUnlimitedCapacity,
  normalizeCapacityInput,
  spotsRemaining,
  isAtCapacity,
  fillPercent,
  UNLIMITED_CAPACITY,
} from '@/lib/capacity';

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));

afterEach(cleanup);

function renderStep(capacity) {
  const update = vi.fn();
  const utils = render(<PremiumStepCapacity data={{ capacity, privacy: 'public' }} update={update} isCircle={false} />);
  return { ...utils, update };
}

describe('Capacity storage semantics', () => {
  it('stores unlimited as null — never 0, 100, or a sentinel number', () => {
    expect(normalizeCapacityInput('')).toBe(null);
    expect(normalizeCapacityInput(null)).toBe(null);
    expect(normalizeCapacityInput(undefined)).toBe(null);
    expect(UNLIMITED_CAPACITY).toBe(null);
  });

  it('keeps numeric capacities unchanged', () => {
    expect(normalizeCapacityInput(12)).toBe(12);
    expect(normalizeCapacityInput('45')).toBe(45);
    expect(isUnlimitedCapacity(45)).toBe(false);
  });

  it('reads legacy 0/undefined rows as unlimited, matching server-side join checks', () => {
    expect(isUnlimitedCapacity(0)).toBe(true);
    expect(isUnlimitedCapacity(undefined)).toBe(true);
  });
});

describe('Capacity enforcement', () => {
  it('enforces a numeric limit', () => {
    expect(spotsRemaining(10, 4)).toBe(6);
    expect(isAtCapacity(10, 9)).toBe(false);
    expect(isAtCapacity(10, 10)).toBe(true);
    expect(fillPercent(10, 5)).toBe(50);
  });

  it('never reports an unlimited event as full', () => {
    expect(spotsRemaining(null, 5000)).toBe(null);
    expect(isAtCapacity(null, 5000)).toBe(false);
    expect(fillPercent(null, 5000)).toBe(null);
  });
});

describe('Capacity step UI', () => {
  it('shows the chosen number for a limited event', () => {
    const { getByTestId, getByLabelText } = renderStep(35);
    expect(getByTestId('capacity-value').textContent).toBe('35');
    expect(getByLabelText('Number of attendees').value).toBe('35');
  });

  it('shows Unlimited and "no attendance limit" instead of 100 or 2–100', () => {
    const { getByTestId, getByLabelText, container } = renderStep(null);
    expect(getByTestId('capacity-value').textContent).toBe('hosting.capacity.unlimited');
    expect(getByLabelText('Number of attendees').value).toBe('hosting.capacity.unlimited');
    expect(container.textContent).toContain('hosting.capacity.no_limit');
    expect(container.textContent).not.toContain('2–100');
  });

  it('selecting Unlimited writes null', () => {
    const { getByLabelText, update } = renderStep(30);
    fireEvent.click(getByLabelText('hosting.capacity.unlimited'));
    expect(update).toHaveBeenCalledWith('capacity', null);
  });

  it('turning Unlimited off restores a numeric capacity', () => {
    const { getByLabelText, update } = renderStep(null);
    fireEvent.click(getByLabelText('hosting.capacity.unlimited'));
    const [field, value] = update.mock.calls.at(-1);
    expect(field).toBe('capacity');
    expect(typeof value).toBe('number');
    expect(value).toBeGreaterThan(0);
  });

  it('editing an existing limited record keeps its number', () => {
    const { getByTestId } = renderStep(7);
    expect(getByTestId('capacity-value').textContent).toBe('7');
  });

  it('editing an existing unlimited record keeps it unlimited', () => {
    const { getByTestId } = renderStep(null);
    expect(getByTestId('capacity-value').textContent).toBe('hosting.capacity.unlimited');
  });
});
