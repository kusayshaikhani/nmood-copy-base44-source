import React from 'react';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {it,expect,vi,afterEach} from 'vitest';
import {NotificationCardFrame} from './PremiumNotificationCard';
afterEach(cleanup);
function setup(type='subscription_expiring',extra={}){const onAction=vi.fn();render(<MemoryRouter><NotificationCardFrame notification={{id:'fixture',_type:type}} title="Notice" body="Message" onAction={onAction} {...extra}/></MemoryRouter>);return onAction;}
it('reveals three full-height distinct renewal actions with original renewal routes and existing dismiss callback',()=>{
 const action=setup();expect(screen.queryByRole('link',{name:'Renew'})).toBeNull();
 expect(screen.queryByLabelText('Dismiss notification')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Notification actions'}));
 const rail=screen.getByTestId('notification-swipe-actions');expect(rail).toHaveClass('inset-y-0');expect(rail).toHaveStyle({width:'84%'});
 expect(screen.getByRole('link',{name:'Renew'})).toHaveAttribute('href','/membership?intent=renew');expect(screen.getByRole('link',{name:'Renew'})).toHaveClass('bg-sky-200','text-slate-950');
 expect(screen.getByRole('link',{name:'Manage Membership'})).toHaveAttribute('href','/membership');expect(screen.getByRole('link',{name:'Manage Membership'})).toHaveClass('bg-blue-700');
 expect(screen.getByRole('button',{name:'Dismiss'})).toHaveClass('bg-red-700','min-h-11','min-w-11');
 fireEvent.click(screen.getByRole('button',{name:'Dismiss'}));expect(action).toHaveBeenCalledTimes(1);expect(action).toHaveBeenCalledWith('delete',expect.objectContaining({id:'fixture'}));
});
it('ordinary notices expose only Dismiss and Escape closes the accessible fallback',()=>{
 setup('system');fireEvent.click(screen.getByRole('button',{name:'Notification actions'}));expect(within(screen.getByTestId('notification-swipe-actions')).getAllByRole('button')).toHaveLength(1);expect(screen.queryByText('Renew')).toBeNull();
 fireEvent.keyDown(screen.getByRole('button',{name:'Dismiss'}),{key:'Escape'});expect(screen.queryByRole('button',{name:'Dismiss'})).toBeNull();
});
it('left swipe reveals, right closes, vertical motion and action-area scrolling do not open',()=>{
 const original=window.PointerEvent;window.PointerEvent=MouseEvent;
 try{setup();const surface=screen.getByTestId('notification-card').parentElement;
 const drag=(target,x,y)=>{fireEvent.pointerDown(target,{clientX:200,clientY:20});fireEvent.pointerUp(target,{clientX:x,clientY:y});};
 drag(surface,190,100);expect(screen.queryByRole('link',{name:'Renew'})).toBeNull();
 drag(surface,50,24);expect(screen.getByRole('link',{name:'Renew'})).toBeVisible();
 drag(surface,300,24);expect(screen.queryByRole('link',{name:'Renew'})).toBeNull();
 drag(screen.getByTestId('notification-actions'),50,24);expect(screen.queryByRole('link',{name:'Renew'})).toBeNull();
 }finally{window.PointerEvent=original;}
});
it('selection mode exposes no swipe actions',()=>{setup('subscription_expiring',{selectMode:true});expect(screen.queryByTestId('notification-swipe-actions')).toBeNull();});
