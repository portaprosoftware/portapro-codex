import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BuilderStep } from './types';

interface StepNavigationProps {
  currentStep: BuilderStep;
  onStepClick: (step: BuilderStep) => void;
  completedSteps: BuilderStep[];
}

const steps = [
  { number: 1, title: 'Basics', description: 'Name and template type' },
  { number: 2, title: 'Sections', description: 'Build your form' },
  { number: 3, title: 'Logic', description: 'Smart automation' },
  { number: 4, title: 'Permissions', description: 'Who can edit what' },
  { number: 5, title: 'Output', description: 'PDF configuration' },
  { number: 6, title: 'Review', description: 'Test and publish' },
];

export const StepNavigation: React.FC<StepNavigationProps> = ({ 
  currentStep, 
  onStepClick, 
  completedSteps 
}) => {
  return (
    <nav aria-label="Template builder progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number as BuilderStep);
          const isCurrent = currentStep === step.number;
          const isClickable = isCompleted || step.number <= currentStep;

          return (
            <li key={step.number} className="relative flex-1">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step button */}
              <button
                onClick={() => isClickable && onStepClick(step.number as BuilderStep)}
                disabled={!isClickable}
                className={cn(
                  "relative flex flex-col items-center group",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    isCurrent && "border-primary bg-primary text-primary-foreground shadow-lg scale-110",
                    isCompleted && !isCurrent && "border-primary bg-primary text-primary-foreground",
                    !isCompleted && !isCurrent && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden md:block">
                    {step.description}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
