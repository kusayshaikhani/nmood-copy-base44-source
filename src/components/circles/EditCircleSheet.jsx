import React, { useState, useEffect } from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { budgetOptions } from '@/lib/budget-utils';
import { feedback } from '@/lib/feedback';
import SmartImage from '@/components/shared/SmartImage';
import { validateImageFile } from '@/lib/upload-security';
import { useLocalization } from '@/lib/i18n/useLocalization';

const PRIVACY_IDS = ['public', 'approval', 'private', 'invite'];
const VISIBILITY_IDS = ['public', 'connections', 'private'];

export default function EditCircleSheet({ open, onOpenChange, circle, onSaved }) {
  const { t } = useLocalization();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('');
  const [category, setCategory] = useState('');
  const [interests, setInterests] = useState('');
  const [location, setLocation] = useState('');
  const [rules, setRules] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [budgetOption, setBudgetOption] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [visibility, setVisibility] = useState('public');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && circle) {
      setName(circle.name || '');
      setDescription(circle.description || '');
      setCover(circle.cover_photo || '');
      setCategory(circle.category || '');
      setInterests((circle.shared_interests || []).join(', '));
      setLocation(circle.location || '');
      setRules(circle.rules || '');
      setMaxMembers(circle.max_members ? String(circle.max_members) : '');
      const b = circle.budget;
      if (!b || b === 'Free' || circle.budget_amount === 0) setBudgetOption('free');
      else if (budgetOptions.some((o) => o.id !== 'custom' && o.id !== 'free' && o.range === b)) setBudgetOption(budgetOptions.find((o) => o.range === b).id);
      else { setBudgetOption('custom'); setCustomAmount(String(circle.budget_amount || b || '')); }
      setPrivacy(circle.privacy || 'public');
      setVisibility(circle.visibility || 'public');
    }
  }, [open, circle]);

  const onUpload = async (file) => {
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.ok) { feedback.message(t('circles.edit.unsupported_file'), v.error); return; }
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) setCover(res.file_url);
    } catch { /* ignore */ }
    finally { setUploading(false); }
  };

  const save = async () => {
    try {
      const updated = await base44.entities.Circle.update(circle.id, {
        name: name.trim(),
        description: description.trim(),
        cover_photo: cover && !cover.startsWith('data:') ? cover : '',
        category: category.trim(),
        shared_interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
        location: location.trim(),
        rules: rules.trim(),
        max_members: maxMembers ? parseInt(maxMembers, 10) : undefined,
        budget: budgetOption === 'free' ? 'Free' : (budgetOption === 'custom' ? String(customAmount || '') : (budgetOptions.find((o) => o.id === budgetOption)?.range || '')),
        budget_amount: budgetOption === 'custom' ? parseFloat(customAmount || 0) : 0,
        privacy,
        visibility,
      });
      feedback.success('circleUpdated');
      onSaved?.(updated);
      onOpenChange?.(false);
    } catch (err) {
      feedback.error(err);
      throw err;
    }
  };

  const field = (label, node) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1.5">{node}</div>
    </div>
  );
  const inputCls = 'w-full h-10 px-3 rounded-xl bg-muted text-sm focus:bg-card focus:outline-none transition-default';

  const privacyLabel = (id) => t(`circles.edit.privacy_${id}`);
  const privacyDesc = (id) => t(`circles.edit.privacy_${id}_desc`);
  const visibilityLabel = (id) => t(`circles.edit.visibility_${id}`);
  const visibilityDesc = (id) => t(`circles.edit.visibility_${id}_desc`);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('circles.edit.title')} footerLabel={t('circles.edit.save_changes')} footerSuccessLabel={t('circles.edit.saved')} onFooterAction={save}>
      <div className="space-y-4">
        {field(t('circles.edit.cover_photo'), (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
            {cover ? <SmartImage src={cover} className="w-full h-full" /> : <div className="w-full h-full" />}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-default cursor-pointer">
              <span className="text-white text-xs flex items-center gap-1">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {t('circles.edit.replace')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} disabled={uploading} />
            </label>
          </div>
        ))}
        {field(t('circles.edit.name'), <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />)}
        {field(t('circles.edit.description'), <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls + ' h-auto py-2 resize-none'} />)}
        {field(t('circles.edit.category'), <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('circles.edit.category_placeholder')} className={inputCls} />)}
        {field(t('circles.edit.interests'), <input value={interests} onChange={(e) => setInterests(e.target.value)} className={inputCls} />)}
        {field(t('circles.edit.location'), <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('circles.edit.location_placeholder')} className={inputCls} />)}
        {field(t('circles.edit.max_members'), <input type="number" min="1" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} placeholder={t('circles.edit.max_members_placeholder')} className={inputCls} />)}
        {field(t('circles.edit.budget'), (
          <select value={budgetOption} onChange={(e) => setBudgetOption(e.target.value)} className={inputCls}>
            <option value="">{t('circles.edit.budget_placeholder')}</option>
            {budgetOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        ))}
        {budgetOption === 'custom' && (
          <input type="number" min="1" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder={t('circles.edit.budget_custom_placeholder')} className={inputCls} />
        )}
        {field(t('circles.edit.rules'), <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={2} placeholder={t('circles.edit.rules_placeholder')} className={inputCls + ' h-auto py-2 resize-none'} />)}
        {field(t('circles.edit.privacy'), (
          <div className="grid grid-cols-2 gap-2">
            {PRIVACY_IDS.map((id) => (
              <button key={id} type="button" onClick={() => setPrivacy(id)}
                className={`p-2.5 rounded-xl border text-start transition-default ${privacy === id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <p className="text-sm font-medium">{privacyLabel(id)}</p>
                <p className="text-[10px] text-muted-foreground">{privacyDesc(id)}</p>
              </button>
            ))}
          </div>
        ))}
        {field(t('circles.edit.visibility'), (
          <div className="grid grid-cols-3 gap-2">
            {VISIBILITY_IDS.map((id) => (
              <button key={id} type="button" onClick={() => setVisibility(id)}
                className={`p-2.5 rounded-xl border text-start transition-default ${visibility === id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <p className="text-sm font-medium">{visibilityLabel(id)}</p>
                <p className="text-[10px] text-muted-foreground">{visibilityDesc(id)}</p>
              </button>
            ))}
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}