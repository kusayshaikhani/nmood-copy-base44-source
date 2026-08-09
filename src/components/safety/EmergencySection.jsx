import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { emergencyContacts, safetyAdvice } from '@/lib/safety-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function EmergencySection() {
  const { t } = useLocalization();
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold mb-3">{t('safety.emergency.title')}</h2>
      <Card className="p-4 mb-3 bg-destructive/5 border-destructive/20">
        <div className="flex items-center gap-2.5 mb-3">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm font-medium text-destructive">
            In an emergency, call local emergency services directly.
          </p>
        </div>
        <Button variant="destructive" className="w-full h-11 gap-2" disabled>
          <Phone className="w-4 h-4" />
          Emergency Call
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          This feature will be available soon.
        </p>
      </Card>
      <Card className="p-4 mb-3">
        <div className="flex items-center gap-2.5 mb-3">
          <Phone className="w-4 h-4 text-destructive" />
          <h3 className="font-semibold text-sm">{t('safety.emergency.numbers')}</h3>
        </div>
        <div className="space-y-2">
          {emergencyContacts.map((contact) => (
            <div key={contact.number} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
              <span className="text-sm">{contact.label}</span>
              <span className="text-sm font-bold text-destructive">{contact.number}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 mb-3">
        <div className="flex items-center gap-2.5 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">{t('safety.staying_safe.advice')}</h3>
        </div>
        <div className="space-y-2.5">
          {safetyAdvice.map((tip) => (
            <div key={tip.title} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2.5 mb-1">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">{t('safety.emergency.contacts')}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Add trusted contacts for quick access. Coming soon.
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2.5 mb-1">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">{t('safety.emergency.share_location')}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Share your live location with trusted contacts. Coming soon.
          </p>
        </Card>
      </div>
    </section>
  );
}