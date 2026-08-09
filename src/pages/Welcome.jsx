import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BrandLogo from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/button';
import { DEFAULT_CONFIG } from '@/lib/system-config';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { usePageTitle } from '@/lib/usePageTitle';

const WELCOME_HERO = 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/c837ffac0_generated_image.png';

// MP-003 — Rich-text legal consent preserved verbatim.
function LegalConsent({ termsUrl, privacyUrl }) {
  const { t } = useLocalization();
  const template = t('auth.legal_consent');
  const parts = template.split(/(\{terms\}|\{privacy\})/);
  return (
    <>
      {parts.map((part, i) => {
        if (part === '{terms}') {
          return (
            <a key="terms" href={termsUrl} className="underline hover:text-foreground" target="_blank" rel="noreferrer">
              {t('auth.terms')}
            </a>
          );
        }
        if (part === '{privacy}') {
          return (
            <a key="privacy" href={privacyUrl} className="underline hover:text-foreground" target="_blank" rel="noreferrer">
              {t('auth.privacy_policy')}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

// UI-024 — Premium welcome. Large hero illustration, aspirational headline.
// All provider / consent logic unchanged.
export default function Welcome() {
  usePageTitle('Welcome');
  const { t } = useLocalization();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-primary/5">
      <header className="flex items-center px-6 py-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <BrandLogo size="default" />
        </motion.div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        {/* hero illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full mb-8"
        >
          <div className="relative rounded-card overflow-hidden shadow-elevated">
            <img
              src={WELCOME_HERO}
              alt=""
              className="w-full h-56 object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-[2rem] leading-[1.1] font-bold tracking-tight text-balance mb-3">
            {t('auth.premium.welcome_headline')}
          </h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed text-balance">
            {t('auth.premium.welcome_subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mb-7 text-xs font-medium text-muted-foreground/80"
        >
          <span className="whitespace-nowrap">
            {t('auth.premium.welcome_diff_swipes')} <span className="text-muted-foreground/40" aria-hidden="true">•</span>
          </span>
          <span className="whitespace-nowrap">
            {t('auth.premium.welcome_diff_experiences')} <span className="text-muted-foreground/40" aria-hidden="true">•</span>
          </span>
          <span className="whitespace-nowrap">
            {t('auth.premium.welcome_diff_mood')}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full space-y-3"
        >
          <Button size="lg" className="w-full h-12 text-base gap-0" asChild>
            <Link to="/register">{t('auth.create_account')}</Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full h-12 text-base" asChild>
            <Link to="/auth">{t('auth.log_in')}</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center text-xs text-muted-foreground/80 mt-5"
        >
          {t('auth.premium.welcome_return_hook')}
        </motion.p>
      </main>

      <footer className="px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <LegalConsent termsUrl={DEFAULT_CONFIG.terms_url} privacyUrl={DEFAULT_CONFIG.privacy_url} />
        </p>
      </footer>
    </div>
  );
}