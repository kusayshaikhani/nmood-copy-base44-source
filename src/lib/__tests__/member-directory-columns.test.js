import { describe, expect, it } from 'vitest';
import { MEMBER_DIRECTORY_DEFAULT_COLUMNS, normaliseVisibleMemberColumns, toggleVisibleMemberColumn } from '@/lib/member-directory-columns';
import { membershipTier } from '@/lib/member-directory';

describe('Mission Control member columns', () => {
  it('keeps the saved visible columns valid and restores defaults when needed', () => {
    expect(normaliseVisibleMemberColumns(['email', 'membership', 'invalid'])).toEqual(['email', 'membership']);
    expect(normaliseVisibleMemberColumns([])).toEqual(MEMBER_DIRECTORY_DEFAULT_COLUMNS);
  });

  it('allows a column to be hidden and restored without hiding the final visible column', () => {
    expect(toggleVisibleMemberColumn(['name', 'membership'], 'membership')).toEqual(['name']);
    expect(toggleVisibleMemberColumn(['name'], 'name')).toEqual(['name']);
    expect(toggleVisibleMemberColumn(['name'], 'membership')).toEqual(['name', 'membership']);
  });
});

describe('Mission Control premium member status', () => {
  it('uses the server-provided tier before any legacy membership record', () => {
    expect(membershipTier({ id: 'member-1', membership_tier: 'premium' }, {})).toBe('premium');
  });
});
