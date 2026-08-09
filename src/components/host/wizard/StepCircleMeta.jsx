import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Globe, UserCheck, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const privacyOptions = [
  { id: 'public', label: 'Public', description: 'Anyone can find and join', icon: Globe },
  { id: 'approval', label: 'Approval', description: 'Anyone can find, you approve joins', icon: UserCheck },
  { id: 'private', label: 'Private', description: 'Hidden — invite only', icon: Lock },
];

export default function StepCircleMeta({ data, update, errors = {} }) {
  const { t } = useLocalization();
  const [communities, setCommunities] = useState([]);
  const selectedCommunity = communities.find((c) => c.id === data.communityId);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const db = await base44.entities.Community.list('-created_date', 50);
        if (active) setCommunities(db || []);
      } catch {
        if (active) setCommunities([]);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('hosting.step.circle_meta_title')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step.circle_meta_desc')}</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" /> {t('hosting.step.parent_community')}
        </label>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {communities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t('community.page.empty_desc') || 'No communities yet. You can create one later.'}</p>
          ) : communities.map((c) => {
            const active = data.communityId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { update('communityId', c.id); update('communityName', c.name); }}
                className={`flex-shrink-0 w-40 text-start p-3 rounded-2xl border-2 transition-default ${
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                {c.cover_photo && <img src={c.cover_photo} alt={c.name} className="w-full h-16 rounded-lg object-cover mb-2" loading="lazy" />}
                <p className="text-sm font-semibold truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.category}</p>
              </button>
            );
          })}
        </div>
        {errors.communityId && <p className="text-xs text-destructive mt-1">{errors.communityId}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" /> {t('circles.edit.privacy')}
        </label>
        <div className="space-y-2">
          {privacyOptions.map((p) => {
            const Icon = p.icon;
            const active = (data.privacy || 'public') === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => update('privacy', p.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-default text-start ${
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.privacy && <p className="text-xs text-destructive mt-1">{errors.privacy}</p>}
      </div>

      {selectedCommunity && (
        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-sm">
          {t('hosting.step.circle_part_of')} <span className="font-semibold text-primary">{selectedCommunity.name}</span>.
        </div>
      )}
    </div>
  );
}