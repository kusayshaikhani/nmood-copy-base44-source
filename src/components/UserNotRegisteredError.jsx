import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function UserNotRegisteredError() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gradient-to-b from-background to-primary/5 px-4 overflow-y-auto momentum-scroll">
      <div className="max-w-md w-full p-8 bg-card rounded-2xl shadow-lg border border-border">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-warning/10">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-8">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-left">
            <p>If you believe this is an error, you can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
          <Button variant="outline" className="w-full mt-6" onClick={() => logout(true)}>
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}