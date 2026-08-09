export const budgetOptions = [
  { id: 'free', label: 'Free' },
  { id: 'under_50', label: 'Under AED 50', range: '0–50' },
  { id: '50_100', label: 'AED 50 – 100', range: '50–100' },
  { id: '100_250', label: 'AED 100 – 250', range: '100–250' },
  { id: '250_plus', label: 'AED 250+', range: '250+' },
  { id: 'custom', label: 'Custom Amount' },
];

export const getBudgetCardLabel = (exp) => {
  if (exp.budgetOption) {
    if (exp.budgetOption === 'free') return 'Free';
    if (exp.budgetOption === 'custom') {
      const amt = exp.customAmount || 0;
      if (!amt) return '';
      return exp.budgetType === 'fixed' ? `AED ${amt} pp` : `Est. AED ${amt} pp`;
    }
    const opt = budgetOptions.find((o) => o.id === exp.budgetOption);
    return opt?.range ? `Est. AED ${opt.range} pp` : '';
  }
  if (!exp.budget) return '';
  if (exp.budget === 'Free' || exp.budget === '$0' || exp.isFree) return 'Free';
  const amt = String(exp.budget).replace(/[$]/g, '').trim();
  return amt ? `AED ${amt} pp` : '';
};

export const getBudgetDetailLabel = (exp) => {
  if (exp.budgetOption) {
    if (exp.budgetOption === 'free') return 'Free';
    if (exp.budgetOption === 'custom') {
      const amt = exp.customAmount || 0;
      if (!amt) return '';
      return exp.budgetType === 'fixed'
        ? `AED ${amt} per person`
        : `Estimated AED ${amt} per person`;
    }
    const opt = budgetOptions.find((o) => o.id === exp.budgetOption);
    return opt?.range ? `Estimated AED ${opt.range} per person` : '';
  }
  if (!exp.budget) return '';
  if (exp.budget === 'Free' || exp.budget === '$0' || exp.isFree) return 'Free';
  const amt = String(exp.budget).replace(/[$]/g, '').trim();
  return amt ? `AED ${amt} per person` : '';
};