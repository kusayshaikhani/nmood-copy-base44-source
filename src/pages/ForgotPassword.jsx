import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabaseAuth } from '@/api/supabaseClient';
import { usePageTitle } from '@/lib/usePageTitle';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthLogo from '@/components/auth/AuthLogo';

export default function ForgotPassword() {
  usePageTitle('Forgot Password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) { setError('Enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await supabaseAuth.resetPasswordForEmail(normalized);
      setSent(true);
    } catch (err) {
      setError(err?.message || 'We could not send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'flex h-[52px] w-full rounded-input border border-border/70 bg-muted/40 px-4 text-base font-normal transition-all placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50';

  return (
    <AuthShell>
      <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 pt-8 sm:pt-12 pb-8">
        <AuthLogo className="h-10 sm:h-12 mb-6" />
        <AuthCard>
          <h1 className="font-heading text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground text-center mb-1.5">Forgot your password?</h1>
          <p className="text-muted-foreground text-[14px] text-center mb-5">Enter your email and we’ll send you instructions to reset your password.</p>
          {sent ? (
            <div className="w-full text-center">
              <p className="text-[14px] text-muted-foreground mb-5">If an account exists for this address, reset instructions are on their way.</p>
              <Link to="/auth" className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card">Back to Sign In</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full space-y-3" noValidate>
              <div>
                <label htmlFor="forgot-email" className="block text-[13px] font-medium text-foreground mb-1.5">Email</label>
                <input id="forgot-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} placeholder="you@example.com" className={inputClass} />
                {error && <p className="mt-2 text-[12px] text-destructive">{error}</p>}
              </div>
              <button type="submit" disabled={loading} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-base shadow-card disabled:opacity-60">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send reset instructions'}
              </button>
            </form>
          )}
          {!sent && <Link to="/auth" className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mt-4"><ArrowLeft className="w-4 h-4" />Back to Sign In</Link>}
        </AuthCard>
      </div>
    </AuthShell>
  );
}
