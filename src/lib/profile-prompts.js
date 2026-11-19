export const PROFILE_PROMPT_OPTIONS = [
  'A perfect weekend looks like…',
  'I can talk for hours about…',
  'The quickest way to make me smile is…',
  'One thing I would love to do this year is…',
];

const MAX_PROMPT_ANSWER_LENGTH = 240;

export function normalizeProfilePrompts(value) {
  const prompts = Array.isArray(value) ? value : [];
  return prompts
    .map((prompt) => {
      if (typeof prompt === 'string') {
        const answer = prompt.trim().slice(0, MAX_PROMPT_ANSWER_LENGTH);
        return answer ? { question: PROFILE_PROMPT_OPTIONS[0], answer } : null;
      }
      const question = typeof prompt?.question === 'string' && PROFILE_PROMPT_OPTIONS.includes(prompt.question)
        ? prompt.question
        : PROFILE_PROMPT_OPTIONS[0];
      const answer = typeof prompt?.answer === 'string'
        ? prompt.answer.trim().slice(0, MAX_PROMPT_ANSWER_LENGTH)
        : '';
      return answer ? { question, answer } : null;
    })
    .filter(Boolean)
    .slice(0, 1);
}

export function setProfilePrompt(value, next) {
  // Do not trim while the member is typing. Trimming here removes every
  // trailing space immediately, making normal sentence entry impossible.
  const question = typeof next?.question === 'string' && PROFILE_PROMPT_OPTIONS.includes(next.question)
    ? next.question
    : PROFILE_PROMPT_OPTIONS[0];
  const answer = typeof next?.answer === 'string' ? next.answer.slice(0, MAX_PROMPT_ANSWER_LENGTH) : '';
  return answer.length ? [{ question, answer }] : [];
}

export { MAX_PROMPT_ANSWER_LENGTH };
