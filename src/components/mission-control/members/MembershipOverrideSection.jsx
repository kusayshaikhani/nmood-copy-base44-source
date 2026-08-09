import React, { useState, useEffect, useCallback } from 'react';
import { Crown, Shield, RefreshCw, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate" title={typeof value === 'string' ? value : undefined}>{value || '—'}</p>
    </div>
  );
}

function sourceLabel(source) {
  if (source === 'founder_override') return 'Founder Override';
  if (source === 'admin_override') return 'Admin Override';
  return 'Purchase';
}

export default function MembershipOverrideSection({ member }) {
  const { toast } = useToast();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [action, setAction] = useState('grant');
  const [duration, setDuration] = useState('lifetime');
  const [customDate, setCustomDate] = useState('');
  const [extendFromCurrent, setExtendFromCurrent] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMembership = useCallback(async () => {
    if (!member?.created_by_id) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('membershipOverride', {
        target_user_id: member.created_by_id,
        action: 'read',
      });
      setMembership(res?.data?.membership || null);
    } catch {
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, [member?.created_by_id]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const currentType = membership?.type || 'explorer';
  const source = membership?.membership_source || 'purchase';
  const isOverride = source === 'founder_override' || source === 'admin_override';
  const currentExpiresAt = membership?.expires_at;
  const isPermanent = !currentExpiresAt || currentExpiresAt === '';

  const resetForm = () => {
    setAction('grant');
    setDuration('lifetime');
    setCustomDate('');
    setExtendFromCurrent(false);
    setReason('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (action === 'revoke') {
        const res = await base44.functions.invoke('membershipOverride', {
          target_user_id: member.created_by_id,
          action: 'set_explorer',
          reason: reason || undefined,
        });
        if (res?.data?.error) throw new Error(res.data.error);
        toast({
          title: 'Premium Removed',
          description: `${member.display_name || member.first_name || 'Member'} reverted to Explorer immediately.`,
        });
      } else {
        // Grant or Adjust Premium
        const permanent = duration === 'lifetime';
        let expiresAt = '';

        if (!permanent) {
          if (duration === 'custom') {
            if (!customDate) throw new Error('Please select a custom expiration date.');
            expiresAt = customDate;
          } else {
            const days = { '7d': 7, '1m': 30, '3m': 90, '6m': 180, '12m': 365 }[duration] || 30;
            if (extendFromCurrent && membership?.expires_at) {
              const currentExp = new Date(membership.expires_at);
              if (currentExp > new Date()) {
                expiresAt = new Date(currentExp.getTime() + days * 86400000).toISOString().slice(0, 10);
              } else {
                expiresAt = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
              }
            } else {
              expiresAt = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
            }
          }
        }

        const res = await base44.functions.invoke('membershipOverride', {
          target_user_id: member.created_by_id,
          action: 'set_premium',
          permanent,
          expires_at: !permanent ? expiresAt : undefined,
          reason: reason || undefined,
        });
        if (res?.data?.error) throw new Error(res.data.error);

        const label = permanent ? 'Lifetime Premium Granted'
          : extendFromCurrent ? 'Premium Extended'
          : duration === 'custom' ? 'Expiration Updated'
          : 'Premium Granted';
        toast({
          title: label,
          description: `${member.display_name || member.first_name || 'Member'} ${permanent ? 'has lifetime Premium' : `expires ${new Date(expiresAt).toLocaleDateString()}`}.`,
        });
      }
      setSheetOpen(false);
      resetForm();
      await fetchMembership();
    } catch (err) {
      toast({
        title: 'Override Failed',
        description: err?.message || 'Could not update membership.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">
        Membership Override
      </h3>
      <div className="rounded-xl border bg-card p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Crown className={`w-4 h-4 ${currentType === 'premium' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-semibold">
                {currentType === 'premium' ? 'Premium' : 'Explorer'}
              </span>
              {isOverride && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {sourceLabel(source)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source" value={sourceLabel(source)} />
              <Field label="Granted By" value={isOverride ? 'Founder' : '—'} />
              <Field
                label="Expires"
                value={isPermanent ? 'Never' : new Date(currentExpiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              />
              <Field label="Plan" value={membership?.plan || '—'} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 gap-2"
              onClick={() => setSheetOpen(true)}
            >
              <Shield className="w-3.5 h-3.5" /> Change Membership
            </Button>
          </>
        )}
      </div>

      {/* Override Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm(); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pr-12">
            <SheetTitle>Membership Override</SheetTitle>
            <SheetDescription>
              Grant or revoke Premium for {member?.display_name || member?.first_name || 'this member'} without payment. All changes are audit-logged.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-4 pb-6">
            <RadioGroup value={action} onValueChange={setAction} className="space-y-3">
              <label htmlFor="grant" className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-default ${action === 'grant' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <RadioGroupItem value="grant" id="grant" className="mt-1" />
                <div>
                  <span className="font-medium flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-primary" /> {currentType === 'premium' ? 'Adjust Premium' : 'Grant Premium'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentType === 'premium'
                      ? 'Override expiration, extend, shorten, or grant lifetime.'
                      : 'Unlock all Premium features for this member.'}
                  </p>
                </div>
              </label>
              <label htmlFor="revoke" className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-default ${action === 'revoke' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <RadioGroupItem value="revoke" id="revoke" className="mt-1" />
                <div>
                  <span className="font-medium">Revoke to Explorer</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Remove Premium and revert to the free tier.</p>
                </div>
              </label>
            </RadioGroup>

            {action === 'grant' && (
              <div className="space-y-3 p-3 rounded-xl bg-muted/30">
                <Label className="text-xs text-muted-foreground">Duration</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '7d', label: '7 Days' },
                    { value: '1m', label: '1 Month' },
                    { value: '3m', label: '3 Months' },
                    { value: '6m', label: '6 Months' },
                    { value: '12m', label: '12 Months' },
                    { value: 'lifetime', label: 'Lifetime' },
                    { value: 'custom', label: 'Custom' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuration(opt.value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-default flex items-center justify-center gap-1 ${
                        duration === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {opt.value === 'lifetime' && <InfinityIcon className="w-3.5 h-3.5" />}
                      {opt.label}
                    </button>
                  ))}
                </div>

                {duration === 'lifetime' && (
                  <p className="text-xs text-muted-foreground">
                    Premium will never expire and will not generate renewal cycles.
                  </p>
                )}

                {duration === 'custom' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="customDate" className="text-xs text-muted-foreground">Expiration Date</Label>
                    <Input
                      id="customDate"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pick any date to override the expiration (earlier dates shorten, later dates extend).
                    </p>
                  </div>
                )}

                {duration !== 'lifetime' && duration !== 'custom' && currentType === 'premium' && !isPermanent && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id="extendFromCurrent"
                      checked={extendFromCurrent}
                      onCheckedChange={(v) => setExtendFromCurrent(!!v)}
                    />
                    <Label htmlFor="extendFromCurrent" className="text-xs font-medium cursor-pointer">
                      Extend from current expiration ({new Date(currentExpiresAt).toLocaleDateString()})
                    </Label>
                  </label>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Testing, support, ambassador, promotional..."
                rows={3}
              />
            </div>

            <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || (action === 'grant' && duration === 'custom' && !customDate)}
            >
            {submitting ? 'Applying...' : action === 'grant'
              ? (currentType === 'premium' ? 'Apply Override' : 'Grant Premium')
              : 'Revoke Premium Immediately'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}