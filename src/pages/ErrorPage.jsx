import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          An unexpected error occurred. Don't worry — try refreshing the page, and if the problem persists, come back later.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />Try Again
          </Button>
          <Button asChild className="gap-2">
            <Link to="/"><Home className="w-4 h-4" />Go Home</Link>
          </Button>
        </div>
        <div className="mt-6">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-default underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}