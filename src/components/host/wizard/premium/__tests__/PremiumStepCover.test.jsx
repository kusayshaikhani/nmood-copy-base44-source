import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import PremiumStepCover from '@/components/host/wizard/premium/PremiumStepCover';

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key) }),
}));
vi.mock('@/components/host/wizard/shared/SuggestedCoverThumb', () => ({ default: () => null }));

const pickCoverImage = vi.fn();
const uploadCoverImage = vi.fn();
const isNativeCameraAvailable = vi.fn();
vi.mock('@/lib/cover-image-upload', () => ({
  pickCoverImage: (...a) => pickCoverImage(...a),
  uploadCoverImage: (...a) => uploadCoverImage(...a),
  isNativeCameraAvailable: () => isNativeCameraAvailable(),
}));

const jpeg = () => new File([new Uint8Array([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  pickCoverImage.mockReset();
  uploadCoverImage.mockReset();
  isNativeCameraAvailable.mockReset().mockReturnValue(true);
  window.URL.createObjectURL = vi.fn(() => 'blob:preview');
  window.URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

function renderStep() {
  const data = { coverPhoto: null };
  const update = vi.fn((field, value) => { data[field] = value; });
  const utils = render(<PremiumStepCover data={data} update={update} />);
  return { ...utils, data, update };
}

describe('Cover image picker + upload', () => {
  it('uploads a gallery image and stores the returned storage URL', async () => {
    pickCoverImage.mockResolvedValue(jpeg());
    uploadCoverImage.mockResolvedValue('https://storage.example/profile-photos/u/covers/a.jpg');
    const { getByText, update } = renderStep();

    await act(async () => { fireEvent.click(getByText('common.upload')); });

    expect(pickCoverImage).toHaveBeenCalledWith('gallery');
    await waitFor(() => expect(update).toHaveBeenCalledWith('coverPhoto', 'https://storage.example/profile-photos/u/covers/a.jpg'));
  });

  it('uploads a camera photo through the same path', async () => {
    pickCoverImage.mockResolvedValue(jpeg());
    uploadCoverImage.mockResolvedValue('https://storage.example/profile-photos/u/covers/b.jpg');
    const { getByText, update } = renderStep();

    await act(async () => { fireEvent.click(getByText('circles.inmood_actions.camera')); });

    expect(pickCoverImage).toHaveBeenCalledWith('camera');
    await waitFor(() => expect(update).toHaveBeenCalledWith('coverPhoto', 'https://storage.example/profile-photos/u/covers/b.jpg'));
  });

  it('shows a local preview immediately and blocks the wizard until the upload finishes', async () => {
    let resolveUpload;
    pickCoverImage.mockResolvedValue(jpeg());
    uploadCoverImage.mockImplementation(() => new Promise((res) => { resolveUpload = res; }));
    const { getByText, container, update } = renderStep();

    await act(async () => { fireEvent.click(getByText('common.upload')); });

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:preview');
    expect(update).toHaveBeenCalledWith('coverUploading', true);

    await act(async () => { resolveUpload('https://storage.example/c.jpg'); });
    await waitFor(() => expect(update).toHaveBeenCalledWith('coverUploading', false));
  });

  it('reports real upload progress', async () => {
    pickCoverImage.mockResolvedValue(jpeg());
    uploadCoverImage.mockImplementation((file, { onProgress }) => new Promise((res) => {
      onProgress(42);
      setTimeout(() => res('https://storage.example/d.jpg'), 0);
    }));
    const { getByText, getByTestId } = renderStep();

    await act(async () => { fireEvent.click(getByText('common.upload')); });

    await waitFor(() => expect(getByTestId('cover-upload-progress').textContent).toContain('42'));
  });

  it('shows a readable error and offers retry when the upload fails', async () => {
    pickCoverImage.mockResolvedValue(jpeg());
    uploadCoverImage.mockRejectedValue(new Error('Storage rejected the file. (413)'));
    const { getByText, getByTestId } = renderStep();

    await act(async () => { fireEvent.click(getByText('common.upload')); });

    await waitFor(() => expect(getByTestId('cover-upload-error').textContent).toBe('Storage rejected the file. (413)'));
    expect(getByText('common.retry')).toBeTruthy();
  });

  it('retry re-uploads the same picked file without re-opening the picker', async () => {
    pickCoverImage.mockResolvedValue(jpeg());
    uploadCoverImage.mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('https://storage.example/e.jpg');
    const { getByText, update } = renderStep();

    await act(async () => { fireEvent.click(getByText('common.upload')); });
    await waitFor(() => getByText('common.retry'));

    await act(async () => { fireEvent.click(getByText('common.retry')); });

    expect(pickCoverImage).toHaveBeenCalledTimes(1);
    expect(uploadCoverImage).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(update).toHaveBeenCalledWith('coverPhoto', 'https://storage.example/e.jpg'));
  });

  it('does nothing when the native picker is dismissed', async () => {
    pickCoverImage.mockResolvedValue(null);
    const { getByText, update } = renderStep();

    await act(async () => { fireEvent.click(getByText('common.upload')); });

    expect(uploadCoverImage).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalledWith('coverUploading', true);
  });
});
