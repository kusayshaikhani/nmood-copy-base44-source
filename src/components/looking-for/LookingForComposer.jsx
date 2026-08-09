import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  intentionTemplates,
  visibilityOptions,
  durationOptions,
} from '@/lib/looking-for-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function LookingForComposer({ open, onOpenChange, member }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [intentionText, setIntentionText] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [duration, setDuration] = useState('today');
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setIntentionText(template.placeholder);
  };

  const handlePost = () => {
    if (!intentionText.trim() || !selectedTemplate) return;
    setPosting(true);
    setTimeout(() => {
      setPosting(false);
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setSelectedTemplate(null);
        setIntentionText('');
        setVisibility('public');
        setDuration('today');
        navigate('/looking-for');
      }, 1500);
    }, 800);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedTemplate(null);
    setIntentionText('');
    setVisibility('public');
    setDuration('today');
    setSuccess(false);
  };

  if (success) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-6" />
          <div className="flex flex-col items-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4"
            >
              <Send className="w-8 h-8 text-success" />
            </motion.div>
            <h3 className="text-lg font-semibold mb-1">{t('looking_for.composer.success_title')}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {t('looking_for.composer.success_desc', { duration: durationOptions.find(d => d.value === duration)?.label || '' })}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)] max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-4" />
        <SheetHeader className="mb-4">
          <SheetTitle>{t('looking_for.composer.title')}</SheetTitle>
          <SheetDescription>{t('looking_for.composer.description')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('looking_for.composer.pick_vibe')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {intentionTemplates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => handleTemplateSelect(t)}
                  className={'flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-default ' + (selectedTemplate?.label === t.label ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-[10px] font-medium text-center leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('looking_for.composer.your_intention')}</Label>
            <Textarea
              value={intentionText}
              onChange={(e) => setIntentionText(e.target.value)}
              placeholder={t('looking_for.composer.placeholder')}
              rows={3}
              className="resize-none"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('looking_for.composer.who_can_see')}</Label>
            <div className="space-y-1.5">
              {visibilityOptions.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVisibility(v.value)}
                  className={'w-full flex items-center gap-3 p-2.5 rounded-xl border transition-default text-left ' + (visibility === v.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}
                >
                  <span className="text-lg">{v.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{v.label}</p>
                    <p className="text-xs text-muted-foreground">{v.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('looking_for.composer.expires_in')}</Label>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={'flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-default ' + (duration === d.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}
                >
                  <span className="text-lg">{d.icon}</span>
                  <span className="text-[10px] font-medium text-center">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button
            onClick={handlePost}
            disabled={!intentionText.trim() || !selectedTemplate || posting}
            className="w-full"
          >
            <Send className="w-4 h-4" />
            {posting ? t('looking_for.composer.posting') : t('looking_for.composer.post_button')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}