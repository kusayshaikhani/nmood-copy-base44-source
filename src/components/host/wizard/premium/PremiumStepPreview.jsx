import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Tag, AlertCircle, Hourglass, Pencil, Coffee, Globe, Eye, Mail, Lock } from 'lucide-react';
import moment from 'moment';
import { getBudgetCardLabel } from '@/lib/budget-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

const privacyMeta = {
  public: { icon: Globe, label: 'Public' },
  approval: { icon: Eye, label: 'Approval' },
  invite: { icon: Mail, label: 'Invite Only' },
  private: { icon: Lock, label: 'Private' },
  connections: { icon: Mail, label: 'Invite Only' },
};

/**
 * Step 6: Premium preview — renders exactly how the experience/circle
 * will appear to members, with inline edit links.
 * Circle: shows privacy type + rules preview.
 * Experience: shows date/time, duration, budget, feature chips.
 */
export default function PremiumStepPreview({ data, errors = {}, onEdit, isCircle }) {
  const { t } = useLocalization();
  const budgetLabel = getBudgetCardLabel(data);

  const computeDuration = (start, end) => {
    if (!start || !end) return null;
    const s = moment(start, 'HH:mm');
    const e = moment(end, 'HH:mm');
    if (!s.isValid() || !e.isValid()) return null;
    let diff = e.diff(s, 'hours', true);
    if (diff <= 0) {
      if (data.overnight === true) diff += 24;
      else return null;
    }
    const h = Math.floor(diff);
    const m = Math.round((diff - h) * 60);
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };
  const duration = computeDuration(data.startTime, data.endTime);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const m = moment(dateStr);
    return m.format('ddd, MMM D');
  };

  const metaItems = [
    data.category && { step: 1, icon: Tag, label: data.category },
    !isCircle && data.date && { step: 2, icon: Calendar, label: formatDate(data.date) },
    !isCircle && data.startTime && { step: 2, icon: Clock, label: `${data.startTime}${data.endTime ? ` – ${data.endTime}` : ''}` },
    !isCircle && duration && { step: 2, icon: Hourglass, label: duration },
    data.location?.venueName && { step: 2, icon: MapPin, label: [data.location.venueName, data.location.city].filter(Boolean).join(', ') },
    data.capacity && { step: 3, icon: Users, label: `${data.capacity} ${isCircle ? 'members' : 'spots'}` },
  ].filter(Boolean);

  const privacyInfo = privacyMeta[data.privacy || 'public'];

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('hosting.step_preview.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('hosting.step_preview.exact_view')}</p>
      </div>

      {/* Missing fields alert */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 rounded-card bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm font-medium text-destructive">{t('hosting.step.preview_required')}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(errors).map((field) => (
              <button
                key={field}
                onClick={() => onEdit(errorToStep(field, isCircle))}
                className="text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                type="button"
              >
                {field}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Premium preview card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="rounded-card overflow-hidden border border-border/50 shadow-elevated bg-card"
      >
        {/* Cover */}
        <div className="relative h-48 bg-muted">
          {data.coverPhoto ? (
            <img src={data.coverPhoto} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Coffee className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          <button onClick={() => onEdit(0)} type="button"
            className="absolute top-3 end-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white active:scale-95 transition-transform">
            <Pencil className="w-4 h-4" />
          </button>
          {data.category && (
            <div className="absolute bottom-3 start-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur text-white text-xs font-medium">
              {data.category}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <button onClick={() => onEdit(1)} type="button" className="text-start w-full">
              <h3 className="text-xl font-bold leading-tight">
                {data.title || (isCircle ? 'Untitled Circle' : 'Untitled Experience')}
              </h3>
            </button>
            {data.whatToExpect && (
              <p className="text-sm text-primary font-medium mt-1">{data.whatToExpect}</p>
            )}
            {data.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{data.description}</p>
            )}
          </div>

          {/* Meta items */}
          <div className="space-y-3 pt-1">
            {metaItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <button onClick={() => onEdit(item.step)} type="button" className="text-xs text-primary hover:underline">
                    {t('hosting.activity.edit')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Privacy (circle) or Budget (experience) */}
          {isCircle && privacyInfo && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40">
              <span className="text-sm text-muted-foreground">Privacy</span>
              <span className="text-sm font-bold text-primary">{privacyInfo.label}</span>
            </div>
          )}
          {!isCircle && budgetLabel && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40">
              <span className="text-sm text-muted-foreground">{t('experiences.confirm.expected_budget')}</span>
              <span className="text-sm font-bold text-primary">{budgetLabel}</span>
            </div>
          )}

          {/* Rules preview (circle only) */}
          {isCircle && (data.rules?.length || 0) > 0 && (
            <div className="space-y-2">
              {data.rules.slice(0, 3).map((rule, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border/50">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground flex-1">{rule}</span>
                </div>
              ))}
              {data.rules.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">+{data.rules.length - 3} more</p>
              )}
            </div>
          )}

          {/* Feature chips preview (experience only) */}
          {!isCircle && (data.customTags?.length > 0 || data.petsAllowed === true || data.familyFriendly === true || data.wheelchairAccessible === true) && (
            <div className="flex flex-wrap gap-1.5">
              {data.petsAllowed === true && <span className="px-2.5 py-1 rounded-full text-[11px] bg-primary/10 text-primary font-medium">Pets</span>}
              {data.familyFriendly === true && <span className="px-2.5 py-1 rounded-full text-[11px] bg-primary/10 text-primary font-medium">Family</span>}
              {data.wheelchairAccessible === true && <span className="px-2.5 py-1 rounded-full text-[11px] bg-primary/10 text-primary font-medium">Accessible</span>}
              {(data.customTags || []).map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] bg-muted text-muted-foreground font-medium">{tag}</span>
              ))}
            </div>
          )}

          {/* Join button */}
          <button type="button" className="w-full h-12 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-sm shadow-card active:scale-[0.98] transition-transform">
            {isCircle ? t('circles.detail.join_circle') : t('create.premium.preview_join')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function errorToStep(field, isCircle) {
  const map = isCircle
    ? { title: 1, category: 1, description: 1, location: 2, capacity: 3 }
    : { title: 1, category: 1, description: 1, date: 2, startTime: 2, location: 2, capacity: 3, budgetOption: 4, customAmount: 4 };
  return map[field] ?? 0;
}