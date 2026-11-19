// Nmood Assistant client — invokes only the authenticated Supabase Edge Function.
// Provider credentials and provider calls remain server-side.
import { invokeSupabaseFunction } from '@/api/supabaseClient';

export function isNmoodAssistantConfigured() { return true; }

export class NmoodAssistantUnavailableError extends Error {
  constructor() {
    super('Nmood assistant is not available yet.');
    this.name = 'NmoodAssistantUnavailableError';
  }
}

// Never exposes an API key/secret to the client — only the signed-in user's
// own Supabase access token, the same way every other Supabase call in this
// app authenticates.
export async function askNmoodAssistant(message,{requestId=crypto.randomUUID()}={}) {
  const trimmed = (message || '').trim();
  if (!trimmed) throw new Error('Enter a message first.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('You appear to be offline. Reconnect and try again.');
  const controller = new AbortController();
  let timeout;
  try {
    const body = await Promise.race([invokeSupabaseFunction('nmood-assistant', { prompt: trimmed.slice(0, 1200),requestId }, { signal: controller.signal, retryAuth: false }), new Promise((_, reject) => {
      timeout = setTimeout(() => { controller.abort(); reject(Object.assign(new Error('assistant_timeout'), { status: 504 })); }, 12000);
    })]);
    if (typeof body?.reply !== 'string' || !body.reply.trim()) throw new Error('assistant_empty_reply');
    return body.reply.trim();
  } catch (error) {
    const code=error?.error;
    if(code==='rolling_limit'){
      const next=error?.next_available_at;const date=typeof next==='string'?new Date(next):null;
      const when=date&&!Number.isNaN(date.getTime())?` You can ask again ${date.toLocaleString()}.`:'';
      throw Object.assign(new Error(`You’ve used your ${error?.limit===5?'5':'1'} Ask Nmood ${error?.limit===5?'questions':'question'} for this rolling 24-hour window.${when} Smart Search is still available.`),{upgradeAvailable:error?.tier!=='premium'});
    }
    if(code==='duplicate_request')throw new Error('This question has already been sent. Smart Search is still available.');
    if(code==='private_information')throw new Error('Please leave personal and private details out of your question. Smart Search is still available.');
    if(code==='explorer_daily_limit')throw Object.assign(new Error('You’ve used your daily Ask Nmood question. Premium includes 5 per 24 hours. Smart Search is still available.'),{upgradeAvailable:true});
    if(code==='premium_daily_limit')throw new Error('You’ve used today’s Ask Nmood questions. Try again tomorrow. Smart Search is still available.');
    if(code==='assistant_in_progress')throw new Error('Your question is still being answered. Smart Search is still available.');
    if(code==='app_daily_limit')throw new Error('That’s today’s Ask Nmood limit. Try again tomorrow. Smart Search is still available.');
    if(['app_rate_limit','quota_exceeded'].includes(code))throw new Error('Give Ask Nmood a moment before asking again. Smart Search is still available.');
    if(error?.status===401||code==='not_authorized')throw new Error('Sign in again to ask Nmood. Smart Search is still available.');
    throw new Error('Ask Nmood is temporarily unavailable. Smart Search is still available.');
  } finally { clearTimeout(timeout); }
}
