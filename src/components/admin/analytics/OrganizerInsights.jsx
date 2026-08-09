import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { topOrganizers } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OrganizerInsights() {
  const { t } = useLocalization();
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{t('admin.organizer_insights')}</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">{t('admin.organizer')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">{t('admin.hosted')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">{t('admin.rating')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">{t('admin.completion')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">{t('admin.cancellation')}</th>
              </tr>
            </thead>
            <tbody>
              {topOrganizers.map((org, i) => (
                <tr key={org.name} className="border-b last:border-0 hover:bg-muted/20 transition-default">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-muted text-xs">{org.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{org.hosted}</td>
                  <td className="px-4 py-3 text-sm"><span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" fill="currentColor" />{org.rating}</span></td>
                  <td className="px-4 py-3 text-sm text-success font-medium">{org.completion}%</td>
                  <td className="px-4 py-3 text-sm text-destructive font-medium">{org.cancellation}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}