import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// This screen appears only for legacy accounts whose private DOB did not
// migrate. The date is sent once through the security-definer server action
// and is never stored in the public member profile or rendered afterwards.
export default function DobRecoveryStep({ onSave, saving, error }) {
  const [dateOfBirth, setDateOfBirth] = useState('');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm leading-6 text-muted-foreground">
            Nmood is for adults. Your date of birth is used only to confirm you are 18 or older and stays private.
          </p>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <label className="block space-y-2" htmlFor="date-of-birth">
        <span className="text-sm font-semibold">Date of birth</span>
        <input
          id="date-of-birth"
          type="date"
          value={dateOfBirth}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(event) => setDateOfBirth(event.target.value)}
          className="flex h-12 w-full rounded-input border border-input bg-background px-3 text-sm"
          required
        />
      </label>

      <Button
        className="h-12 w-full shadow-elevated"
        disabled={!dateOfBirth || saving}
        onClick={() => onSave(dateOfBirth)}
      >
        {saving ? 'Verifying…' : 'Verify and continue'}
      </Button>
    </div>
  );
}
