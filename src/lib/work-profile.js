import { WORK_CATALOG, OTHER_WORK_TITLE } from './work-catalog';
export const WORK_TEXT_LIMIT = 100;
export const emptyWorkDraft = () => ({ industry: '', title: '', specification: '' });
export function parseWorkText(value) {
 if (typeof value !== 'string' || !value) return emptyWorkDraft();
 for (const entry of WORK_CATALOG) {
  const prefix = `${entry.industry} — `;
  if (!value.startsWith(prefix)) continue;
  const title = value.slice(prefix.length);
  if (entry.titles.includes(title) && title !== OTHER_WORK_TITLE) return { industry: entry.industry, title, specification: '' };
  if (entry.titles.includes(OTHER_WORK_TITLE) && title.startsWith('Other: ') && title.slice(7).trim()) return { industry: entry.industry, title: OTHER_WORK_TITLE, specification: title.slice(7) };
 }
 return { legacy: value };
}
// Main stores both optional fields in the existing work_text column. Keep the
// separator when one field is empty so reloading never moves it to another field.
export function parseMainWorkText(value) {
 const parsed=parseWorkText(value);
 if (!Object.hasOwn(parsed,'legacy')) return {freeText:true,industry:parsed.industry,title:parsed.title===OTHER_WORK_TITLE?parsed.specification:parsed.title};
 const separator=value.indexOf('—');
 return separator<0 ? {freeText:true,industry:'',title:value} : {freeText:true,industry:value.slice(0,separator).trim(),title:value.slice(separator+1).trim()};
}
export function serializeWorkDraft(draft) {
 if (!draft || typeof draft !== 'object' || Array.isArray(draft)) throw new Error('Choose your Industry and Title again.');
 if (Object.hasOwn(draft, 'legacy')) {
  if (typeof draft.legacy !== 'string' || [...draft.legacy].length > WORK_TEXT_LIMIT) throw new Error('Work must be at most 100 characters.');
  return draft.legacy;
 }
 if (draft.freeText===true) {
  if(typeof draft.industry!=='string'||typeof draft.title!=='string')throw new Error('Enter optional work text.');
  const industry=draft.industry.trim(),title=draft.title.trim();
  const text=industry||title?`${industry} — ${title}`:'';
  if([...text].length>WORK_TEXT_LIMIT)throw new Error('Work must be at most 100 characters.');
  return text;
 }
 const { industry, title, specification } = draft;
 if (industry === '' && title === '' && specification === '') return '';
 const entry = WORK_CATALOG.find(item => item.industry === industry);
 if (!entry) throw new Error('Choose an Industry from the list.');
 if (!entry.titles.includes(title)) throw new Error('Choose a Title for your Industry.');
 if (title === OTHER_WORK_TITLE && (typeof specification !== 'string' || !specification.trim())) throw new Error('Please specify your work.');
 const text = `${industry} — ${title === OTHER_WORK_TITLE ? `Other: ${specification.trim()}` : title}`;
 if ([...text].length > WORK_TEXT_LIMIT) throw new Error('Shorten Please specify so the complete Work value is at most 100 characters.');
 return text;
}
export function prepareWorkFields(fields = {}) {
 const { _workDraft, ...persisted } = fields;
 if (_workDraft != null) persisted.work_text = serializeWorkDraft(_workDraft);
 return persisted;
}
export function workDraftError(data) {
 try { prepareWorkFields(data); return ''; } catch (error) { return error.message; }
}
