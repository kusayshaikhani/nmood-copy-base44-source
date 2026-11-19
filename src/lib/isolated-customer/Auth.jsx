import React,{createContext,useContext,useEffect,useRef,useState,useCallback} from 'react';
import {queryClientInstance} from '../query-client';
import {customerSession,customerFlow} from './runtime.mjs';
import {bindIsolatedAppAdapters,isolatedAppAdapters} from '../isolated-app/active.mjs';
import {CountryTestProvider,CountryAccessBoundary} from '../country-verification/runtime';
const Context=createContext(null);
export const useAuth=()=>{const c=useContext(Context);if(!c)throw Error('ISOLATED_AUTH_REQUIRED');return c;};
export function AuthProvider({children}){
 const auth=customerSession(),[state,setState]=useState({user:null,member:null}),[runtime,setRuntime]=useState(null),[error,setError]=useState(null);
 const release=useRef(null),bound=useRef(null),onboardingDraftRef=useRef(null);
 const unbind=useCallback(()=>{release.current?.();release.current=null;bound.current=null;queryClientInstance.clear();setRuntime(null);setState({user:null,member:null});},[]);
 const checkUserAuth=useCallback(async()=>{
  if(!auth.snapshot()){unbind();setError(null);return null;}
  const session=await auth.verified();
  if(bound.current!==session){release.current?.();queryClientInstance.clear();const flow=customerFlow();release.current=bindIsolatedAppAdapters(flow);bound.current=session;setRuntime(flow.countryRuntime());}
  const client=isolatedAppAdapters().client,boot=await client.bootstrap();
  if(auth.snapshot()!==session)throw Error('SESSION_CHANGED');
  if(boot.countryRequired){setState({user:session.user,member:null});return null;}
  const value=await client.session();if(auth.snapshot()!==session||value.user?.id!==session.user.id)throw Error('SESSION_CHANGED');value.member=await client.profile({action:'read'});if(value.member.photo_media_id)value.member.photo_url=await isolatedAppAdapters().media.display(value.member.photo_media_id);setState({...value,user:{...value.user,email:session.user.email}});setError(null);return value.member;
 },[auth,unbind]);
 useEffect(()=>auth.subscribe(()=>{if(!auth.snapshot())unbind();}),[auth,unbind]);
 useEffect(()=>()=>{release.current?.();},[]);
 const logout=()=>{auth.clear();unbind();};
 const value={...state,isAuthenticated:!!state.user,isLoadingAuth:false,isRefreshingAuth:false,isLoadingPublicSettings:false,authChecked:true,authError:error,appPublicSettings:null,onboardingDraftRef,logout,navigateToLogin:()=>{logout();window.location.assign('/SignIn');},refreshMember:checkUserAuth,checkUserAuth,checkAppState:checkUserAuth};
 return <Context.Provider value={value}>{runtime?<CountryTestProvider value={runtime}><CountryAccessBoundary><VerifiedSession refresh={checkUserAuth}>{children}</VerifiedSession></CountryAccessBoundary></CountryTestProvider>:children}</Context.Provider>;
}
function VerifiedSession({refresh,children}){
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{let live=true;refresh().then(()=>{if(live)setReady(true);}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[refresh]);
 if(failed)return <p role="alert">Your isolated account could not be opened. Sign out and try again.</p>;
 return ready?children:<p role="status">Opening your account…</p>;
}
