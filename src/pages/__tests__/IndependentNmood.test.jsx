import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import IndependentNmood from '@/pages/IndependentNmood';

const mockAsk = vi.fn();
vi.mock('@/lib/nmood-assistant', async () => {
  const actual = await vi.importActual('@/lib/nmood-assistant');
  return {
    ...actual,
    askNmoodAssistant: (message) => mockAsk(message),
  };
});
import { NmoodAssistantUnavailableError } from '@/lib/nmood-assistant';

afterEach(() => {
  cleanup();
  mockAsk.mockReset();
});

describe('Nmood assistant tab — submit and quick prompts', () => {
  it('quick-prompt button calls the assistant with the prompt text (not just filling the input)', async () => {
    mockAsk.mockResolvedValue('Here are three circles you might like.');
    const { getByText } = render(<IndependentNmood />);

    fireEvent.click(getByText('Suggest something social to do today'));

    expect(mockAsk).toHaveBeenCalledWith('Suggest something social to do today');
    await waitFor(() => expect(getByText('Here are three circles you might like.')).toBeTruthy());
  });

  it('submitting the form calls the assistant and shows the real response, never an echo of the input', async () => {
    mockAsk.mockResolvedValue('A real assistant answer.');
    const { getByPlaceholderText, getByLabelText, queryByText } = render(<IndependentNmood />);

    fireEvent.change(getByPlaceholderText('Ask Nmood anything…'), { target: { value: 'hello there' } });
    fireEvent.click(getByLabelText('Send'));

    await waitFor(() => expect(mockAsk).toHaveBeenCalledWith('hello there'));
    await waitFor(() => expect(queryByText('A real assistant answer.')).toBeTruthy());
    expect(queryByText(/nmood received/i)).toBeNull();
    expect(queryByText('“hello there”')).toBeNull();
  });

  it('shows the "not available yet" state when no backend is configured — never a fake answer', async () => {
    mockAsk.mockRejectedValue(new NmoodAssistantUnavailableError());
    const { getByText, queryByText } = render(<IndependentNmood />);

    fireEvent.click(getByText('How can I get more from Nmood?'));

    await waitFor(() => expect(getByText(/not available yet/i)).toBeTruthy());
    expect(queryByText(/how can i get more from nmood\?/i)).not.toBeNull(); // the prompt button itself, not an echoed reply
  });

  it('shows a retry action on a genuine error, and retry re-sends the same message', async () => {
    mockAsk.mockRejectedValueOnce(new Error('Network error, please try again.'));
    mockAsk.mockResolvedValueOnce('Recovered answer.');
    const { getByText, getByPlaceholderText, getByLabelText } = render(<IndependentNmood />);

    fireEvent.change(getByPlaceholderText('Ask Nmood anything…'), { target: { value: 'retry me' } });
    fireEvent.click(getByLabelText('Send'));

    await waitFor(() => expect(getByText('Network error, please try again.')).toBeTruthy());

    fireEvent.click(getByText('Retry'));
    await waitFor(() => expect(getByText('Recovered answer.')).toBeTruthy());
    expect(mockAsk).toHaveBeenCalledTimes(2);
    expect(mockAsk).toHaveBeenNthCalledWith(2, 'retry me');
  });
});
