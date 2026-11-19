import { describe, expect, it } from 'vitest';
import { normalizeProfilePrompts, setProfilePrompt } from '@/lib/profile-prompts';

describe('profile prompt answers', () => {
  it('preserves spaces while a member types', () => {
    expect(setProfilePrompt([], { question: 'A perfect weekend looks like…', answer: 'Coffee with friends' }))
      .toEqual([{ question: 'A perfect weekend looks like…', answer: 'Coffee with friends' }]);
  });

  it('normalizes only the saved value, keeping spaces inside the answer', () => {
    expect(normalizeProfilePrompts([{ question: 'A perfect weekend looks like…', answer: '  Coffee with friends  ' }]))
      .toEqual([{ question: 'A perfect weekend looks like…', answer: 'Coffee with friends' }]);
  });
});
