import React, { useState } from 'react';
import { FlaskConical, Play, ThumbsUp } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const PROVIDERS = ['automatic', 'openai', 'anthropic', 'gemini', 'azure'];
const LANGS = ['en', 'ar', 'es', 'fr', 'de', 'hi', 'ko', 'zh'];

/** AI-001 — Admin playground: runs a request through the orchestrator and shows the standardized response. */
export default function AiBrainPlayground({ data, onRan }) {
  const { t } = useLocalization();
  const services = ((data || {}).services || []).filter((s) => s.status === 'registered');
  const [service, setService] = useState(services[0]?.id || '');
  const [prompt, setPrompt] = useState('Suggest a thoughtful weekend experience idea for a member interested in photography and coffee.');
  const [language, setLanguage] = useState('en');
  const [provider, setProvider] = useState('automatic');
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);

  const run = async () => {
    setLoading(true);
    setRes(null);
    try {
      const r = await base44.functions.invoke('aiBrain', { mode: 'invoke', ai_service: service, prompt, language, provider });
      setRes(r?.data || null);
      onRan?.();
    } catch (e) {
      setRes({ status: 'failed', reasoning_summary: 'Request failed to complete.', error_type: 'client_error' });
    } finally {
      setLoading(false);
    }
  };

  const accept = async () => {
    if (!res?.request_id) return;
    try { await base44.functions.invoke('aiBrain', { mode: 'accept', request_id: res.request_id }); onRan?.(); } catch (_e) {}
  };

  const isRec = (services.find((s) => s.id === service)?.category || '').toLowerCase().includes('recommendation');

  return (
    <MCSection icon={FlaskConical} title={t('mission.ai_brain_playground')}>
      <p className="text-xs text-muted-foreground mb-3">
        Send a test request through the central orchestrator. Admin-only; never exposes API keys, system prompts, or internal configuration.
      </p>
      <div className="space-y-3">
        <div className="grid sm:grid-cols-3 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.service')}</span>
            <select value={service} onChange={(e) => setService(e.target.value)} className="bg-card border rounded-lg text-sm px-2.5 py-1.5">
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.provider')}</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="bg-card border rounded-lg text-sm px-2.5 py-1.5">
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.language')}</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-card border rounded-lg text-sm px-2.5 py-1.5">
              {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="bg-card border rounded-lg text-sm px-3 py-2 w-full" placeholder={t('mission.request_prompt')} />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={run} disabled={loading || !service || !prompt} className="gap-2">
            <Play className="w-4 h-4" /> {loading ? 'Running…' : 'Run through Brain'}
          </Button>
          {res?.status === 'success' && isRec && <Button size="sm" variant="outline" onClick={accept} className="gap-2"><ThumbsUp className="w-4 h-4" /> {t('mission.mark_accepted')}</Button>}
        </div>

        {res && (
          <div className="rounded-lg border bg-card/60 p-3 mt-2">
            <div className="flex flex-wrap gap-2 text-xs mb-2">
              <span className={`px-2 py-0.5 rounded-full font-medium ${res.status === 'success' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>{res.status}</span>
              {res.response_id && <span className="text-muted-foreground">response_id: {res.response_id}</span>}
              <span className="text-muted-foreground">provider: {res.provider}</span>
              <span className="text-muted-foreground">confidence: {res.confidence_score}</span>
              <span className="text-muted-foreground">{res.processing_time_ms}ms</span>
              <span className="text-muted-foreground">safety: {res.safety_status}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{res.reasoning_summary}</p>
            {res.result != null && (
              <pre className="text-xs bg-muted/40 rounded p-2 overflow-auto max-h-64 whitespace-pre-wrap">{typeof res.result === 'string' ? res.result : JSON.stringify(res.result, null, 2)}</pre>
            )}
            <p className="text-[11px] text-muted-foreground/70 mt-2">{res.explainability_placeholder}</p>
          </div>
        )}
      </div>
    </MCSection>
  );
}