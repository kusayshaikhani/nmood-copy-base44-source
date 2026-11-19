import { invokeSupabaseFunction } from '@/api/supabaseClient';

export const AI_NOT_CONFIGURED_MESSAGE =
  'Nmood AI answers are not configured yet. Your question was not sent to an AI provider.';

export async function askNmoodAI(question) {
  const prompt = String(question || '').trim();
  if (!prompt) throw new Error('Ask a question first.');
  if (prompt.length > 1000) throw new Error('Please keep your question under 1,000 characters.');
  try {
    const result = await invokeSupabaseFunction('nmood-ai', { question: prompt });
    if (!result?.answer) throw new Error('Nmood AI returned no answer.');
    return { answer: result.answer, searchedWeb: result.searched_web === true };
  } catch (error) {
    if (error?.status === 503 || error?.error === 'ai_not_configured' || error?.message === 'function_unavailable') {
      throw new Error(AI_NOT_CONFIGURED_MESSAGE);
    }
    throw new Error(error?.message === 'rate_limited'
      ? 'You have reached the current Nmood AI limit. Please try again later.'
      : 'Nmood AI could not answer right now. Please try again.');
  }
}
