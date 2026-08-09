import React from 'react';

export default function YesNoToggle({ value, onChange }) {
  const btnClass = (active) =>
    'h-11 rounded-xl border-2 text-sm font-medium transition-default ' +
    (active ? 'border-primary bg-primary/5 text-primary' : 'border-border');

  return (
    <div className="grid grid-cols-2 gap-2">
      <button onClick={() => onChange(true)} type="button" className={btnClass(value === true)}>
        Yes
      </button>
      <button onClick={() => onChange(false)} type="button" className={btnClass(value === false)}>
        No
      </button>
    </div>
  );
}