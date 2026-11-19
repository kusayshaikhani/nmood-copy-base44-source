import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function latestDob(today = new Date()) {
  return today.toISOString().slice(0, 10);
}

// Date of birth is optional. When supplied, it stays private and is used only
// to calculate a member's age if they choose to display that age.
export default function DobRecoveryStep({ onSave, onSkip, saving, error, value, onChange }) {
  const [localDate, setLocalDate] = useState('');
  const dateOfBirth = value ?? localDate;
  const setDateOfBirth = onChange || setLocalDate;
  const [validationError, setValidationError] = useState('');

  const handleContinue = () => {
    if (!dateOfBirth) {
      onSkip?.();
      return;
    }
    if (dateOfBirth > latestDob()) {
      setValidationError('Choose a date that is not in the future.');
      return;
    }
    setValidationError('');
    onSave(dateOfBirth);
  };


  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm leading-6 text-muted-foreground">
            Adding your date of birth is optional. It is used only to calculate your age if you choose to show it. Your date of birth and birth year are never shown to other members.
          </p>
        </div>
      </div>

      {(validationError || error) && <p role="alert" className="text-sm text-destructive">{validationError || error}</p>}

      <label className="block space-y-2" htmlFor="date-of-birth">
        <span className="text-sm font-semibold">Date of birth (optional)</span>
        <input
          id="date-of-birth"
          type="date"
          value={dateOfBirth}
          max={latestDob()}
          onChange={(event) => { setDateOfBirth(event.target.value); setValidationError(''); }}
          className="flex h-12 w-full rounded-input border border-input bg-background px-3 text-sm"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="outline" className="h-12" disabled={saving} onClick={onSkip}>
          Skip for now
        </Button>
        <Button type="button" className="h-12 shadow-elevated" disabled={!dateOfBirth || saving} onClick={handleContinue}>
          {saving ? 'Saving…' : 'Save and continue'}
        </Button>
      </div>
    </div>
  );
}
