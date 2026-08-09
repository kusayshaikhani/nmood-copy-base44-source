import { useLocation, Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { usePageTitle } from '@/lib/usePageTitle';

export default function PageNotFound() {
  const location = useLocation();
  const { t } = useLocalization();
  const pageName = location.pathname.substring(1);
  usePageTitle('Page Not Found');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold tracking-tighter bg-gradient-to-b from-foreground/20 to-foreground/5 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-xl font-semibold mb-2">{t('error.404.title')}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {t('error.404.description')}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />{t('error.404.back')}
          </Button>
          <Button asChild className="gap-2">
            <Link to="/"><Home className="w-4 h-4" />{t('error.404.home')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}