import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatWithConcierge, quickPrompts } from '@/lib/concierge-engine';
import ConciergeSuggestion from './ConciergeSuggestion';
import AILoadingMessage from '@/components/shared/AILoadingMessage';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ConciergeChat({ member, user }) {
  const { t } = useLocalization();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setMessages([{ role: 'concierge', content: t('ai.chat.greeting') }]);
    return () => { mountedRef.current = false; };
  }, [t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const newMessages = [...messages, { role: 'user', content: message }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithConcierge(member, user, message, newMessages);
      if (!mountedRef.current) return;
      setMessages((prev) => [...prev, {
        role: 'concierge',
        content: response.message,
        recommendations: response.recommendations || [],
      }]);
    } catch {
      if (!mountedRef.current) return;
      setMessages((prev) => [...prev, {
        role: 'concierge',
        content: t('ai.chat.error'),
      }]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                {msg.role === 'user' ? (
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-md bg-primary text-primary-foreground text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      {i === 0 && (
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-muted text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                    {msg.recommendations?.length > 0 && (
                      <div className="space-y-2 ps-9">
                        {msg.recommendations.map((rec, ri) => (
                          <ConciergeSuggestion key={ri} recommendation={rec} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AILoadingMessage
              messages={[
                t('ai.chat.loading1'),
                t('ai.chat.loading2'),
                t('ai.chat.loading3'),
                t('ai.chat.loading4'),
              ]}
            />
          </motion.div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              type="button"
              className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-default text-muted-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t('ai.chat.placeholder')}
          className="flex-1 h-10 px-3.5 rounded-xl bg-muted border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-default"
          disabled={loading}
        />
        <Button
          size="icon"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1.5 text-center">
        {t('ai.concierge.advisory')}
      </p>
    </div>
  );
}