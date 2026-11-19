const names = { monthly: 'Nmood M', quarterly: 'Nmood Q', halfyear: 'Nmood H', annual: 'Nmood A' };
export function subscriptionPlan({ period, plan, planId, productId, product_id } = {}) {
  const duration = { P1M: 'monthly', P3M: 'quarterly', P6M: 'halfyear', P1Y: 'annual', P12M: 'annual' }[period];
  if (duration) return duration;
  if (names[planId || plan]) return planId || plan;
  const id = String(productId || product_id || '').toLowerCase();
  return Object.entries({ annual: /(?:^|[._-])(annual|yearly)(?:$|[._-])/, quarterly: /(?:^|[._-])(quarterly|three_month)(?:$|[._-])/, halfyear: /(?:^|[._-])(halfyear|six_month)(?:$|[._-])/, monthly: /(?:^|[._-])monthly(?:$|[._-])/ }).find(([, pattern]) => pattern.test(id))?.[0] || null;
}
export function subscriptionName(value) { return names[subscriptionPlan(value)] || 'Nmood subscription'; }
