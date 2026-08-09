import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

const greetingTemplates = [
  "Hey! It's been a while. How are you? 😊",
  "Thinking of you! Let's catch up soon. ☕",
  "Saw something that reminded me of you. Hope you're well! ✨",
  "Hi! Would love to reconnect. Free this weekend? 🌟",
];

export default function GreetingSheet({ open, onOpenChange, pal }) {
  const { t } = useLocalization();
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState('');
  const [sent, setSent] = useState(false);

  const firstName = pal?.name?.split(' ')[0] || 'Pal';

  const reset = () => { setSelected(null); setCustom(''); setSent(false); };

  const handleSend = () => {
    setSent(true);
    setTimeout(() => { reset(); onOpenChange(false); }, 1500);
  };

  const message = custom.trim() || selected;

  return (
    <BottomSheet open={open} onOpenChange={(o) => { if (!o) setTimeout(reset, 300); onOpenChange(o); }} title={sent ? '' : `Greet ${firstName}`}>
      {sent ? (
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 text-success" />
          </div>
          <p className="font-semibold text-sm">Greeting Sent!</p>
          <p className="text-xs text-muted-foreground mt-1">{firstName} will see your message.</p>
        </div>
      ) : (
        <div className="pb-2">
          <p className="text-xs text-muted-foreground mb-2">Choose a greeting:</p>
          <div className="space-y-2 mb-3">
            {greetingTemplates.map(g => (
              <button key={g} onClick={() => setSelected(g)} type="button"
                className={`w-full p-3 rounded-xl border text-sm text-start transition-default ${
                  selected === g ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}>
                {g}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-1">Or write your own:</p>
          <textarea value={custom} onChange={(e) => setCustom(e.target.value.slice(0, 200))} placeholder="Write a personal message..."
            rows={3} className="w-full p-3 text-sm rounded-xl bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default resize-none" />
          <p className="text-xs text-muted-foreground text-end mt-1">{custom.length}/200</p>
          <Button className="w-full mt-3" disabled={!message} onClick={handleSend}>{t('reconnect.greeting.send')}</Button>
        </div>
      )}
    </BottomSheet>
  );
}