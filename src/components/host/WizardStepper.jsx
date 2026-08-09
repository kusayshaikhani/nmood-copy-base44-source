import React from 'react';
import { Check } from 'lucide-react';

const defaultLabels = ['Cover', 'Title', 'Category', 'Date', 'Location', 'Capacity', 'Budget', 'Details', 'Preview'];

export default function WizardStepper({ currentStep, onStepClick, labels }) {
  const stepLabels = labels || defaultLabels;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          Step {currentStep + 1} of {stepLabels.length}
        </span>
        <span className="text-sm text-muted-foreground">{stepLabels[currentStep]}</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {stepLabels.map((label, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          const dotClass = isComplete || isCurrent
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground';
          const lineClass = i < currentStep ? 'bg-primary' : 'bg-muted';

          return (
            <div key={i} className="flex items-center flex-shrink-0">
              <button
                onClick={() => onStepClick && i <= currentStep && onStepClick(i)}
                disabled={i > currentStep}
                className={'w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-default ' + dotClass}
              >
                {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </button>
              {i < stepLabels.length - 1 && (
                <div className={'w-3 h-0.5 ' + lineClass} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}