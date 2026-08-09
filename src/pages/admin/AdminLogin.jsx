import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AdminLogin() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already authenticated admin → straight to console
  useEffect(() => {
    if (!isLoadingAuth && user?.role === 'admin') navigate('/admin', { replace: true });
  }, [isLoadingAuth, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your credentials.');
      return;
    }
    setLoading(true);
    try {
      // Flag so AuthContext can land us on /admin after the SDK's post-login reload.
      sessionStorage.setItem('admin_target', '/admin');
      await base44.auth.loginViaEmailPassword(email, password);
      // loginViaEmailPassword hard-redirects to '/'; AuthContext completes the redirect.
    } catch (err) {
      sessionStorage.removeItem('admin_target');
      setError(err?.message || 'Invalid credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-default mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t('admin.back_to_app')}
        </Link>

        <div className="rounded-2xl border bg-card shadow-xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">{t('admin.admin_portal')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('admin.administrator_access_only')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder={t('admin.admin_email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder={t('admin.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="flex items-center gap-2 mt-6 p-3 rounded-lg bg-muted/50">
            <ShieldCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {t('admin.unauthorized_access_is_prohibited_all')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}