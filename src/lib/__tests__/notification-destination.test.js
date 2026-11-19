import { describe, expect, it } from 'vitest';
import { notificationDestination } from '@/lib/notification-destination';

describe('welcome notification destination', () => {
  it('sends the Start exploring action to Home instead of legacy Explore', () => {
    expect(notificationDestination({ _type: 'welcome', _path: '/explore' })).toBe('/');
  });

  it('keeps the Home destination for welcome messages without a saved route', () => {
    expect(notificationDestination({ _type: 'welcome' })).toBe('/');
  });
});
