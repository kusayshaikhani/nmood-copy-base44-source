import React, { useState, useEffect } from 'react';
import { Mail, Phone, Camera, MapPin, Check, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import PhoneVerificationDialog from '@/components/profile/PhoneVerificationDialog';
import PhotoVerificationDialog from '@/components/profile/PhotoVerificationDialog';
import { base44 } from '@/api/base44Client';

// RC-005 — Phone verification is now production-ready. The placeholder dialog
// ("available before public launch" + OK button) has been replaced with a full
// OTP flow (PhoneVerificationDialog). The "Future" placeholders section has been
// removed from Release 1.0.
export default function TrustVerification({ member, onVerified }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);
  const [photoVerifyOpen, setPhotoVerifyOpen] = useState(false);
  const [photoStatus, setPhotoStatus] = useState('none');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('photoVerification', { action: 'status' });
        const body = res?.data || res;
        if (active && body?.ok) setPhotoStatus(body.status || 'none');
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []);

  const cards = [
    {
      icon: Mail,
      titleKey: 'trust.item.email',
      status: t('trust.status.verified'),
      verified: true,
      action: null,
    },
    {
      icon: Phone,
      titleKey: 'trust.item.phone',
      status: member?.phone_verified ? t('trust.status.verified') : t('trust.status.not_verified'),
      verified: !!member?.phone_verified,
      action: member?.phone_verified ? null : { label: t('trust.action.verify_phone'), onClick: () => setPhoneVerifyOpen(true) },
    },
    {
      icon: Camera,
      titleKey: 'trust.item.photo',
      status: member?.identity_verified
        ? t('trust.status.verified')
        : photoStatus === 'pending'
          ? (t('trust.status.pending') || 'In review')
          : (t('trust.status.not_verified')),
      verified: !!member?.identity_verified,
      action: member?.identity_verified
        ? null
        : { label: photoStatus === 'pending' ? (t('trust.status.pending') || 'In review') : (t('trust.action.verify_photo') || 'Verify photo'), onClick: () => setPhotoVerifyOpen(true) },
    },
    {
      icon: MapPin,
      titleKey: 'trust.item.location',
      status: member?.location_enabled ? t('trust.status.enabled') : t('trust.status.disabled'),
      verified: !!member?.location_enabled,
      action: member?.location_enabled ? null : { label: t('trust.action.enable'), to: '/settings' },
    },
  ];

  const handleAction = (c) => {
    trackProductEvent(PRODUCT_EVENTS.VERIFICATION_STARTED, { item: c.titleKey });
    if (c.action.onClick) c.action.onClick();
    else if (c.action.to) navigate(c.action.to);
  };

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold">{t('trust.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.titleKey} className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-default ${
                c.verified ? 'border-success/30 bg-success/5' : 'border-border bg-muted/30'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    c.verified ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    <Icon className={`w-4 h-4 ${c.verified ? 'text-success' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{t(c.titleKey)}</p>
                    <div className="flex items-center gap-1">
                      {c.verified ? (
                        <Check className="w-3 h-3 text-success" strokeWidth={3} />
                      ) : (
                        <X className="w-3 h-3 text-muted-foreground" strokeWidth={3} />
                      )}
                      <span className={`text-xs font-medium ${c.verified ? 'text-success' : 'text-muted-foreground'}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                </div>
                {c.action && (
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1" onClick={() => handleAction(c)}>
                    {c.action.label}
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <PhoneVerificationDialog
        open={phoneVerifyOpen}
        onOpenChange={setPhoneVerifyOpen}
        member={member}
        onVerified={onVerified}
      />

      <PhotoVerificationDialog
        open={photoVerifyOpen}
        onOpenChange={setPhotoVerifyOpen}
        member={member}
        onApproved={onVerified}
      />
    </>
  );
}