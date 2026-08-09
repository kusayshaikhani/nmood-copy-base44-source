import React, { useState } from 'react';
import { Sparkles, Play } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const PROVIDERS = ['automatic', 'openai', 'anthropic', 'gemini', 'azure'];
const LANGS = ['en', 'ar', 'es', 'fr'];

/** AI-003 — Assistant registry + admin playground (invokes through the orchestrator; writes audit trail). */
export default function AiOpsAssistants({ data, onRan }) {
  const { t } = useLocalization();
  const d = data || {};
  const assistants = d.assistants || [];
  const [assistant, setAssistant] = useState(assistants[0]?.id || '');
  const [provider, setProvider] = useState('automatic');
  const [language, setLanguage] = useState('en');
  const [prompt, setPrompt] = useState('Give a member a warm, actionable suggestion for their weekend.');
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);

  const run = async () => {
    setLoading(true); setRes(null);
    try {
      const r = await base44.functions.invoke('aiOps', { mode: 'invokeAssistant', assistant_id: assistant, prompt, provider, language });
      setRes(r?.data || null); onRan?.();
    } catch (_e) { setRes({ status: 'failed', reasoning_summary: 'Request failed to complete.' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <MCSection icon={Sparkles} title={t('mission.ai_assistant_registry')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {assistants.map((a) => (
            <div key={a.id} className="rounded-lg border bg-card/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{a.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${a.human_review_required ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>{a.human_review_required ? 'Human review' : 'active'}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 capitalize">{a.category}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(a.capabilities || []).map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{c}</span>)}
              </div>
              {a.note && <p className="text-[11px] text-warning/80 mt-1">{a.note}</p>}
            </div>
          ))}
        </div>
      </MCSection>

      <MCSection icon={Play} title={t('mission.assistant_playground_admin')}>
        <p className="text-xs text-muted-foreground mb-3">{t('mission.invokes_an_assistant_through_the')}</p>
        <div className="grid sm:grid-cols-3 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.assistant')}</span>
            <select value={assistant} onChange={(e) => setAssistant(e.target.value)} className="bg-card border rounded-lg text-sm px-2.5 py-1.5">
              {assistants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="bg-card border rounded-lg text-sm px-3 py-2 w-full mt-2" placeholder={t('mission.assistant_request')} />
        <Button size="sm" onClick={run} disabled={loading || !assistant || !prompt} className="gap-2 mt-2"><Play className="w-4 h-4" /> {loading ? 'Running…' : 'Invoke Assistant'}</Button>

        {res && (
          <div className="rounded-lg border bg-card/60 p-3 mt-3">
            <div className="flex flex-wrap gap-2 text-xs mb-2">
              <span className={`px-2 py-0.5 rounded-full font-medium ${res.status === 'success' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>{res.status}</span>
              {res.assistant_name && <span className="text-muted-foreground">{res.assistant_name}</span>}
              <span className="text-muted-foreground">provider: {res.provider}</span>
              <span className="text-muted-foreground">confidence: {res.confidence_score}</span>
              <span className="text-muted-foreground">{res.processing_time_ms}ms</span>
              {res.human_review_required && <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning">{t('mission.human_review_required')}</span>}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{res.reasoning_summary}</p>
            {res.result != null && <pre className="text-xs bg-muted/40 rounded p-2 overflow-auto max-h-64 whitespace-pre-wrap">{typeof res.result === 'string' ? res.result : JSON.stringify(res.result, null, 2)}</pre>}
            <p className="text-[11px] text-muted-foreground/70 mt-2">{res.explainability_placeholder}</p>
          </div>
        )}
      </MCSection>
    </div>
  );
}