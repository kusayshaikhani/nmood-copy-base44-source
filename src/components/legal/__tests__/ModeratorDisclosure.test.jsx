import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {readFileSync} from 'node:fs';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import CommunityGuidelines from '@/pages/CommunityGuidelines';
import RegistrationPolicyLinks from '../RegistrationPolicyLinks';
import {MODERATOR_OBSERVATION_DISCLOSURE} from '../ModeratorObservationDisclosure';
const native=vi.hoisted(()=>({isNativePlatform:vi.fn(()=>false)}));
const browser=vi.hoisted(()=>({open:vi.fn().mockResolvedValue(undefined)}));
vi.mock('@capacitor/core',()=>({Capacitor:native}));
vi.mock('@capacitor/browser',()=>({Browser:browser}));
vi.mock('@/lib/usePageTitle',()=>({usePageTitle:vi.fn()}));
vi.mock('@/lib/safe-navigation',()=>({useSafeBack:()=>vi.fn()}));
afterEach(()=>{cleanup();native.isNativePlatform.mockReturnValue(false);browser.open.mockReset().mockResolvedValue(undefined);});
const exact=[
 'For safety, abuse prevention, and enforcement of our community rules, authorized Nmood moderators may review content shared within Circles and Experiences. This may include messages, the sender’s displayed identity, and attachments shared in that same Circle or Experience.',
 'Moderator access is limited to the relevant Circle or Experience and does not include private direct messages or unrelated personal information. Moderator activity is access-controlled and recorded for accountability.',
];
it.each([TermsOfService,PrivacyPolicy,CommunityGuidelines])('renders exact disclosure and last-updated date on policy page',Page=>{
 render(<MemoryRouter><Page /></MemoryRouter>);
 expect(MODERATOR_OBSERVATION_DISCLOSURE).toEqual(exact);
 for(const paragraph of exact)expect(screen.getByText(paragraph)).toBeVisible();
 expect(screen.getByText('Last Updated: 16 September 2026')).toBeVisible();
});
it('provides all three separate-tab public links without unmounting the form',()=>{
 render(<><input aria-label="Draft" defaultValue="Preserved"/><RegistrationPolicyLinks/></>);
 for(const [name,path] of [['Terms of Service','/terms'],['Privacy Policy','/privacy'],['Community Rules','/community-guidelines']]){
  const link=screen.getByRole('link',{name});expect(link).toHaveAttribute('href',path);expect(link).toHaveAttribute('target','_blank');expect(link).toHaveAttribute('rel','noopener noreferrer');
 }
 expect(screen.getByRole('textbox',{name:'Draft'})).toHaveValue('Preserved');
});
it('opens native policies in the system browser with retryable failure and intact form',async()=>{
 native.isNativePlatform.mockReturnValue(true);browser.open.mockRejectedValueOnce(new Error('private details'));
 render(<><input aria-label="Draft" defaultValue="Preserved"/><RegistrationPolicyLinks/></>);
 fireEvent.click(screen.getByRole('link',{name:'Community Rules'}));
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Please try the link again.'));
 expect(screen.queryByText('private details')).toBeNull();
 fireEvent.click(screen.getByRole('link',{name:'Community Rules'}));
 await waitFor(()=>expect(browser.open).toHaveBeenLastCalledWith({url:'https://app.nmood.app/community-guidelines'}));
 expect(screen.getByRole('textbox',{name:'Draft'})).toHaveValue('Preserved');
});
it('keeps public routes and Settings access, and wires the shared links into signup and every onboarding step',()=>{
 const app=readFileSync('src/App.jsx','utf8');
 for(const path of ['/terms','/privacy','/privacy-policy','/community-guidelines'])expect(app).toContain(`path="${path}"`);
 const settings=readFileSync('src/components/settings/LegalSafetySection.jsx','utf8');
 for(const path of ['/terms','/privacy','/community-guidelines'])expect(settings).toContain(`to="${path}"`);
 for(const file of ['src/pages/CreateAccount.jsx','src/components/onboarding/OnboardingShell.jsx'])expect(readFileSync(file,'utf8')).toContain('<RegistrationPolicyLinks />');
});
