import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { restoreSupabaseSessionFromUrl, getSupabaseSession, supabaseAuth } from '@/api/supabaseClient';
import { usePageTitle } from '@/lib/usePageTitle';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthLogo from '@/components/auth/AuthLogo';

export default function ResetPassword() {
  usePageTitle('Reset Password');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    restoreSupabaseSessionFromUrl();
    setStatus(getSupabaseSession()?.access_token ? 'ready' : 'invalid');
  }, []);

  async function handleReset(event) {
    event.preventDefault();
    if (password.length < 8) { setError('Use at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setStatus('saving');
    setError('');
    try {
      await supabaseAuth.updatePassword(password);
      setStatus('complete');
      window.setTimeout(() => navigate('/auth', { replace: true }), 1800);
    } catch (err) {
      setStatus('ready');
      setError(err?.message || 'This reset link is no longer valid. Request a new one.');
    }
  }

  const inputClass = 'flex h-[52px] w-full rounded-input border border-border/70 bg-muted/40 px-4 text-base font-normal transition-all focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50';

  if (status === 'checking') return <AuthShell><div className="flex justify-center pt-24 text-white"><Loader2 className="w-6 h-6 animate-spin" /></div></AuthShell>;
  if (status === 'invalid') return (
    <AuthShell><div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-16 pb-8"><AuthLogo className="h-10 sm:h-12 mb-6" /><AuthCard>
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-5 mx-auto"><AlertCircle className="w-7 h-7" /></div>
      <h1 className="font-heading text-[24px] font-bold text-center mb-2">This reset link is invalid or expired</h1>
      <p className="text-muted-foreground text-[14px] text-center mb-6">Request a new password reset link and use it right away.</p>
      <Link to="/forgot-password" className="flex h-[52px] w-full items-center justify-center rounded-button bg-nmood-cta text-primary-foreground font-semibold">Request a new link</Link>
    </AuthCard></div></AuthShell>
  );
  if (status === 'complete') return (
    <AuthShell><div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-16 pb-8"><AuthLogo className="h-10 sm:h-12 mb-6" /><AuthCard>
      <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-5 mx-auto"><CheckCircle2 className="w-7 h-7" /></div>
      <h1 className="font-heading text-[24px] font-bold text-center mb-2">Password updated</h1><p className="text-muted-foreground text-[14px] text-center">Taking you back to sign in…</p>
    </AuthCard></div></AuthShell>
  );

  return (
    <AuthShell><div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-12 pb-8"><AuthLogo className="h-10 sm:h-12 mb-6" /><AuthCard>
      <h1 className="font-heading text-[24px] sm:text-[28px] font-bold text-center mb-1.5">Choose a new password</h1>
      <p className="text-muted-foreground text-[14px] text-center mb-5">Use a strong password with at least 8 characters.</p>
      <form onSubmit={handleReset} className="w-full space-y-3" noValidate>
        <div><label htmlFor="reset-password" className="block text-[13px] font-medium text-foreground mb-1.5">New password</label><div className="relative"><input id="reset-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={status === 'saving'} className={inputClass + ' pr-12'} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
        <div><label htmlFor="reset-confirm" className="block text-[13px] font-medium text-foreground mb-1.5">Confirm password</label><div className="relative"><input id="reset-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={status === 'saving'} className={inputClass + ' pr-12'} /><button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground">{showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <button type="submit" disabled={status === 'saving'} className="flex h-[52px] w-full items-center justify-center rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card disabled:opacity-60">{status === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update password'}</button>
      </form>
    </AuthCard></div></AuthShell>
  );
}
