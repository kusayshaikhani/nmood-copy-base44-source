// Quotes are resolved exclusively from the current authorized message collection.
// Never render cached/client-supplied quote text after the original is removed.
export function resolveReplyPreviews(rows, textKey = 'content') {
  const visible = new Map(rows.filter(row => !row.deleted_at).map(row => [row.id, row]));
  return rows.map(row => {
    const original = visible.get(row.reply_to_id);
    return { ...row, reply_available: !!original, reply_to_text: original
      ? (typeof original[textKey] === 'string' && original[textKey] ? original[textKey].slice(0, 160) : 'Attachment')
      : '' };
  });
}
export function openReferencedMessage(id) {
  const element = document.getElementById(`message-${id}`);
  if (!element) return false;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.focus({ preventScroll: true });
  return true;
}
