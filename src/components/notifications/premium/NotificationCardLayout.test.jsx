import React from 'react';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, it, expect, vi } from 'vitest';
import { Bell } from 'lucide-react';
vi.mock('@/lib/i18n/useLocalization', () => ({ useLocalization: () => ({ t: key => key }) }));
vi.mock('@/components/profile/ProfileAvatar', () => ({ default: ({ src, alt, className }) => <img src={src} alt={alt} className={className} /> }));
vi.mock('@/lib/explorer-policy', async original => ({ ...await original(), useExplorerPolicy: () => ({ data: { premium: false } }) }));
import Card from './PremiumNotificationCard';
afterEach(cleanup);
const notice = { id: 'fixture', icon: Bell, title: 'A title', description: 'Long body '.repeat(80), timestamp: 'Just now', actions: [{ label: 'Open', action: 'open_activity' }], read: false };
it('uses identical frame height, full width, body clamping and action row for every category including locked requests', () => {
 const types = ['connection_request', 'profile_view', 'direct_message', 'circle_join_request', 'experience_cancelled', 'system_notice', 'subscription_expiring'];
 render(<MemoryRouter>{types.map(_type => <Card key={_type} notification={{ ...notice, _type }} onAction={vi.fn()} />)}</MemoryRouter>);
 const cards = screen.getAllByTestId('notification-card'); expect(cards).toHaveLength(types.length);
 for (const card of cards) {
  expect(card).toHaveClass('w-full', 'h-28', 'sm:h-[7.5rem]', 'p-2', 'sm:p-2.5', 'grid-rows-[minmax(0,1fr)_2.75rem]', 'bg-white', 'border-violet-100', 'rounded-2xl');
  expect(within(card).getByTestId('notification-body').firstChild).toHaveClass('line-clamp-1');
  expect(within(card).getByTestId('notification-actions')).toHaveClass('overflow-x-auto', 'max-w-[75%]');
  expect(within(card).getByLabelText('Unread')).toHaveClass('h-2.5', 'w-2.5', 'bg-violet-500', 'border-white');
  expect(within(card).getByTestId('notification-timestamp').parentElement).toBe(within(card).getByTestId('notification-actions').parentElement);
  for (const action of within(card).queryAllByRole('link').concat(within(card).queryAllByRole('button'))) expect(action).toHaveClass('min-h-11', 'min-w-11');
 }
 expect(screen.getAllByRole('link', { name: /Request received/ })).toHaveLength(2);
});
it('never mounts locked identity, image, private title or path and retains selection/read behavior', () => {
 const select = vi.fn();
 render(<MemoryRouter><Card notification={{ ...notice, _type: 'profile_view', _locked: true, title: 'Private name', description: 'Secret title', thumbnail: '/private-photo', _path: '/pal/private' }} selectMode selected onToggleSelect={select} /></MemoryRouter>);
 expect(document.body.textContent).not.toMatch(/Private name|Secret title/);
 expect(document.querySelector('img')).toBeNull(); expect(document.querySelector('a[href="/pal/private"]')).toBeNull();
 fireEvent.click(screen.getByRole('button', { name: 'Deselect notification' })); expect(select).toHaveBeenCalledWith('fixture');
 expect(screen.getByTestId('notification-card')).toHaveAttribute('data-unread', 'true');
});

it('profile views use 48px circular avatars, 52px on wider layouts, with Open in the shared footer', () => {
 const action = vi.fn();
 render(<MemoryRouter><Card notification={{ ...notice, _type: 'profile_view', thumbnail: '/fixture-face.jpg', _actor: { display_name: 'Test member' } }} onAction={action} /></MemoryRouter>);
 expect(screen.getByRole('img', { name: 'Test member' })).toHaveClass('h-12', 'w-12', 'sm:h-[52px]', 'sm:w-[52px]', '!rounded-full', 'border', 'border-white');
 fireEvent.click(screen.getByRole('button', { name: 'Open' }));
 expect(action).toHaveBeenCalledWith('open_activity', expect.objectContaining({ _type: 'profile_view' }));
});
it.each(['connection_request','system_notice'])('%s uses a compact 44px icon tile with no face image', _type => {
 render(<MemoryRouter><Card notification={{ ...notice, _type }} onAction={vi.fn()} /></MemoryRouter>);
 expect(screen.getByTestId('notification-visual')).toHaveClass('h-11', 'w-11');
 expect(screen.queryByRole('img')).toBeNull();
 expect(screen.getByTestId('notification-card')).toHaveClass('h-28', 'sm:h-[7.5rem]');
});
it('read cards retain the same dimensions while removing only the unread dot', () => {
 render(<MemoryRouter><Card notification={{ ...notice, _type: 'system_notice', read: true }} /></MemoryRouter>);
 expect(screen.queryByLabelText('Unread')).toBeNull();
 expect(screen.getByTestId('notification-card')).toHaveClass('h-28', 'sm:h-[7.5rem]', 'bg-white');
});
