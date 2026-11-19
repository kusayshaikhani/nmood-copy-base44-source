import React from 'react';
import { motion } from 'framer-motion';
import { Users, Tag, Pencil, Globe, Eye, Mail } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const privacyMeta = {
  public: { icon: Globe, labelKey: 'create.circle.privacy_public_title' },
  approval: { icon: Eye, labelKey: 'create.circle.privacy_private_title' },
  invite: { icon: Mail, labelKey: 'create.circle.privacy_hidden_title' },
};

/**
 * UI-021 — Circle Step 5: Live preview exactly as members will see it.
 * Cover, Logo, Name, Category, Description, Member Count, Join button, Edit links.
 */
export default function CircleStepPreview({ data, onEdit }) {
  const { t } = useLocalization();
  const privacy = data.privacy || 'public';
  const PrivacyIcon = privacyMeta[privacy]?.icon || Globe;

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('create.circle.preview_title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('create.circle.preview_subtitle')}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="rounded-card overflow-hidden border border-border/50 shadow-elevated bg-card"
      >
        {/* Cover with logo overlay */}
        <div className="relative h-44 bg-muted">
          {data.coverPhoto ? (
            <img src={data.coverPhoto} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
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

          {/* Logo overlapping cover bottom edge */}
          <div className="absolute -bottom-10 start-5">
            <div className="w-20 h-20 rounded-full border-4 border-card overflow-hidden shadow-card bg-card">
              {data.logoPhoto ? (
                <img src={data.logoPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 pt-12 space-y-4">
          <div>
            <button onClick={() => onEdit(1)} type="button" className="text-start w-full">
              <h3 className="text-xl font-bold leading-tight">
                {data.title || t('create.circle.untitled')}
              </h3>
            </button>
            {data.whatToExpect && (
              <p className="text-sm text-primary font-medium mt-1">{data.whatToExpect}</p>
            )}
            {data.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{data.description}</p>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-2">
            {data.category && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-medium">
                <Tag className="w-3 h-3 text-muted-foreground" /> {data.category}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-medium">
              <PrivacyIcon className="w-3 h-3 text-muted-foreground" /> {t(privacyMeta[privacy]?.labelKey)}
            </div>
            {data.language && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-medium">
                {data.language}
              </div>
            )}
          </div>

          {/* Member count placeholder + rules count */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">1 {t('create.circle.preview_members')}</p>
                <p className="text-xs text-muted-foreground">{t('create.circle.preview_you_organizer')}</p>
              </div>
            </div>
            {(data.rules?.length || 0) > 0 && (
              <button onClick={() => onEdit(3)} type="button" className="text-xs text-primary font-medium hover:underline">
                {data.rules.length} {t('create.circle.preview_rules')}
              </button>
            )}
          </div>

          {/* Rules preview */}
          {(data.rules?.length || 0) > 0 && (
            <div className="space-y-2">
              {data.rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border/50">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground flex-1">{rule}</span>
                </div>
              ))}
            </div>
          )}

          {/* The creator previews their own Circle, so joining is not an action. */}
          <div className="pt-1">
            <button onClick={() => onEdit(0)} type="button"
              className="w-full h-12 rounded-button border border-border text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> {t('hosting.activity.edit')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}