import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {MemoryRouter,Routes,Route,useLocation} from 'react-router-dom';
import {afterEach,it,expect} from 'vitest';
import FloatingBack, {backFallback} from './FloatingBack';
function View(){const l=useLocation();return <><FloatingBack/><output>{l.pathname}{l.search}</output><span>{l.state?.fixture}</span></>;}
afterEach(()=>{cleanup();window.history.replaceState({},'');});
it('returns through real history rather than replacing with a stale from path, preserving prior state',()=>{
 window.history.replaceState({idx:1},'');render(<MemoryRouter initialEntries={[{pathname:'/notifications',search:'?filter=unread',state:{fixture:'kept'}},{pathname:'/pal/test',state:{from:'/explore'}}]}><View/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(screen.getByText('/notifications?filter=unread')).toBeVisible();expect(screen.getByText('kept')).toBeVisible();
});
it('uses safe detail fallback for a deep link and hides on root tabs',()=>{
 render(<MemoryRouter initialEntries={['/circle/test']}><View/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(screen.getByText('/communities')).toBeVisible();expect(screen.queryByRole('button',{name:'Back'})).toBeNull();
});
it('uses dedicated-listing and My Nmood fallbacks for direct launches',()=>{expect(backFallback('/circles')).toBe('/explore');expect(backFallback('/experiences')).toBe('/explore');expect(backFallback('/memories')).toBe('/nmood');});
it('keeps a 44px accessible button outside scrolling content',()=>{
 render(<MemoryRouter initialEntries={['/settings']}><Routes><Route path="*" element={<View/>}/></Routes></MemoryRouter>);
 expect(screen.getByRole('button',{name:'Back'})).toHaveClass('min-h-11','min-w-11','bg-transparent');expect(screen.queryByText('Back')).toBeNull();expect(screen.getByRole('navigation',{name:'Back navigation'})).toHaveClass('shrink-0');
});
