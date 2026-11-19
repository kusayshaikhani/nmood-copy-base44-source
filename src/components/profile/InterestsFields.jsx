import React from 'react';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { interests as allInterests } from '@/lib/onboarding-data';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';
export const MIN_INTERESTS=3;
export const MAX_INTERESTS=5;
export default function InterestsFields({data,update,errors={}}) {
 const {t}=useLocalization();
 const availableInterests=allInterests.filter(item=>!(data.interests||[]).includes(item.id));
 const toggleInterest=id=>{
  const selected=data.interests||[];
  if(selected.includes(id))update({interests:selected.filter(value=>value!==id)});
  else if(selected.length<MAX_INTERESTS)update({interests:[...selected,id]});
 };
 return (
          <div id="edit-section-interests" className="space-y-2">
            <Label>{t('profile.edit.interests_count', { count: (data.interests || []).length, max: MAX_INTERESTS })}</Label>
            {(data.interests || []).length >= MAX_INTERESTS && (
              <p className="text-xs text-muted-foreground">{t('onboarding.interests.max_error', { max: MAX_INTERESTS })}</p>
            )}
            {(data.interests || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.interests.map((id) => (
                  <button key={id} onClick={() => toggleInterest(id)} type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {categoryLabel(t, id)}<X className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}
            {availableInterests.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {availableInterests.map((interest) => {
                  const Icon = interest.icon;
                  return (
                    <button key={interest.id} onClick={() => toggleInterest(interest.id)} type="button" className="flex items-center gap-2 p-2.5 rounded-xl border border-border hover:border-muted-foreground/30 transition-default text-left">
                      <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4" /></div>
                      <span className="text-sm font-medium">{categoryLabel(t, interest.id)}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.interests && <p className="text-xs text-destructive">{errors.interests}</p>}
          </div>

);
}
