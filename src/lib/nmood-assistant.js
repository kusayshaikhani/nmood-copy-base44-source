// Nmood tab assistant — Supabase-backed only. Base44 is never used here.
//
// No Supabase-backed assistant endpoint exists yet (checked: supabase/functions
// has no chat/assistant function). Until VITE_SUPABASE_NMOOD_ASSISTANT_URL is
// configured to point at one, the assistant reports itself as unavailable —
// it never fakes or echoes a response.
import { getSupabaseSession } from '@/api/supabaseClient';

const ASSISTANT_FUNCTION_URL = import.meta.env.VITE_SUPABASE_NMOOD_ASSISTANT_URL || '';

export function isNmoodAssistantConfigured() {
  return Boolean(ASSISTANT_FUNCTION_URL);
}

export class NmoodAssistantUnavailableError extends Error {
  constructor() {
    super('Nmood assistant is not available yet.');
    this.name = 'NmoodAssistantUnavailableError';
  }
}

// Never exposes an API key/secret to the client — only the signed-in user's
// own Supabase access token, the same way every other Supabase call in this
// app authenticates.
export async function askNmoodAssistant(message) {
  const trimmed = (message || '').trim();
  if (!trimmed) throw new Error('Enter a message first.');
  if (!isNmoodAssistantConfigured()) {
    throw new NmoodAssistantUnavailableError();
  }
  const session = getSupabaseSession();
  const response = await fetch(ASSISTANT_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ message: trimmed }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.reply) {
    throw new Error(body?.error || 'Nmood assistant could not respond. Please try again.');
  }
  return body.reply;
}
