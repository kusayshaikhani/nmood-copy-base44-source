import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import NativeProfileSelect from '@/components/profile/NativeProfileSelect';
import { MAX_PROMPT_ANSWER_LENGTH, PROFILE_PROMPT_OPTIONS, normalizeProfilePrompts, setProfilePrompt } from '@/lib/profile-prompts';
import { PROFILE_FIELD_CLASS } from './profile-field-style';

export default function ProfilePromptFields({ value, onChange }) {
  const prompt = normalizeProfilePrompts(value)[0] || { question: PROFILE_PROMPT_OPTIONS[0], answer: '' };
  const update = (next) => onChange(setProfilePrompt(value, { ...prompt, ...next }));

  return <section id="edit-section-prompt" aria-labelledby="profile-prompt-title" className="min-w-0 space-y-2 rounded-xl border border-border p-4">
    <div>
      <Label id="profile-prompt-title" htmlFor="profile-prompt-question">Profile prompt</Label>
      <p className="mt-1 text-xs text-muted-foreground">Add one answer so people have an easy way to start a conversation.</p>
    </div>
    <NativeProfileSelect
      id="profile-prompt-question"
      value={prompt.question}
      path="PROFILE-PROMPT-QUESTION"
      options={PROFILE_PROMPT_OPTIONS.map(option => ({ value: option, label: option }))}
      className={`${PROFILE_FIELD_CLASS} w-full`}
      onChange={(question) => update({ question })}
    />
    <Textarea
      aria-label="Your profile prompt answer"
      value={prompt.answer}
      onChange={(event) => update({ answer: event.target.value })}
      placeholder="Write your answer"
      maxLength={MAX_PROMPT_ANSWER_LENGTH}
      rows={3}
    />
    <p className="text-right text-xs text-muted-foreground">{prompt.answer.length}/{MAX_PROMPT_ANSWER_LENGTH}</p>
  </section>;
}
