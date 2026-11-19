import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { Bell } from 'lucide-react';
vi.mock('@/lib/i18n/useLocalization',()=>({useLocalization:()=>({t:key=>key})}));
import Card from './PremiumNotificationCard';
afterEach(cleanup);
it('shows a readable nonblocking renewal notice with both valid destinations',()=>{
 const body='Your membership remains active until its displayed expiry date.';
 render(<MemoryRouter><Card notification={{id:'reminder',_type:'subscription_expiring',icon:Bell,title:'Membership renewal reminder',description:body,actions:[{label:'Open'}]}} onAction={vi.fn()}/></MemoryRouter>);
 expect(screen.getByText(body)).toBeVisible();expect(screen.getByText(body)).toHaveClass('line-clamp-1');
 expect(screen.queryByRole('link',{name:'Renew'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Notification actions'}));
 expect(screen.getByRole('link',{name:'Renew'})).toHaveAttribute('href','/membership?intent=renew');
 expect(screen.getByRole('link',{name:'Manage Membership'})).toHaveAttribute('href','/membership');
 expect(screen.queryByText('Open')).toBeNull();expect(screen.queryByRole('dialog')).toBeNull();
});
