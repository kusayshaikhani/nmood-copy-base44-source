export function complimentaryExpiry(duration, custom, now = new Date()) {
  const end = new Date(now);
  if (duration === 'custom') {
    const selected = new Date(custom);
    if (!Number.isFinite(selected.getTime()) || selected <= now) throw Error('Choose a future end date and time.');
    return selected.toISOString();
  }
  if (duration === 'year') end.setFullYear(end.getFullYear() + 1);
  else if (['7', '30', '90'].includes(duration)) end.setDate(end.getDate() + Number(duration));
  else throw Error('Choose a valid duration.');
  return end.toISOString();
}
