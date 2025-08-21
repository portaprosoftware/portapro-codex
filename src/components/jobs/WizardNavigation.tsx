import React from 'react';
import { Check, Users, Calendar, MapPin, Truck, Boxes, ClipboardCheck, ListChecks } from 'lucide-react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { cn } from '@/lib/utils';

const steps = [
  {
    number: 1,
    title: 'Customer',
    description: 'Select customer',
    icon: Users,
  },
  {
    number: 2,
    title: 'Job Details',
    description: 'Type & scheduling',
    icon: Calendar,
  },
  {
    number: 3,
    title: 'Location',
    description: 'Service location',
    icon: MapPin,
  },
  {
    number: 4,
    title: 'Assignment',
    description: 'Driver & vehicle',
    icon: Truck,
  },
  {
    number: 5,
    title: 'Products & Services',
    description: 'Units & services',
    icon: Boxes,
  },
  {
    number: 6,
    title: 'Review',
    description: 'Confirm & create',
    icon: ListChecks,
  },
];

export function WizardNavigation() {
  const { state, goToStep } = useJobWizard();

  const getStepStatus = (stepNumber: number) => {
    // For step 5 (Products & Services), only mark complete after both sub-steps are done
    if (stepNumber === 5) {
      if (state.currentStep > 6) return 'completed'; // Past both sub-steps
      if (state.currentStep === 5 || state.currentStep === 6) return 'current'; // In either sub-step
      return 'upcoming';
    }
    
    // Adjust for removed step 6 - step 6 is now Review (was step 7)
    const adjustedCurrentStep = state.currentStep > 6 ? state.currentStep - 1 : state.currentStep;
    const adjustedStepNumber = stepNumber === 6 ? 7 : stepNumber; // Review is now step 6 in UI but step 7 in logic
    
    if (adjustedStepNumber < adjustedCurrentStep) return 'completed';
    if (adjustedStepNumber === adjustedCurrentStep) return 'current';
    return 'upcoming';
  };

  const isStepClickable = (stepNumber: number) => {
    // Don't allow clicking on step 5 if we're in the services sub-step (step 6)
    if (stepNumber === 5 && state.currentStep === 6) return false;
    
    // Adjust for step logic - Review (step 6 in UI) is step 7 in logic
    const adjustedStepNumber = stepNumber === 6 ? 7 : stepNumber;
    const adjustedCurrentStep = state.currentStep > 6 ? state.currentStep - 1 : state.currentStep;
    
    return adjustedStepNumber <= adjustedCurrentStep;
  };

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, stepIdx) => {
          const status = getStepStatus(step.number);
          const Icon = step.icon;
          const isClickable = isStepClickable(step.number);

          return (
            <li key={step.number} className="flex items-center flex-1">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    if (isClickable) {
                      // Handle clicking on step 6 (Review) - go to step 7
                      const targetStep = step.number === 6 ? 7 : step.number;
                      goToStep(targetStep);
                    }
                  }}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    status === 'completed' && "bg-primary border-primary text-primary-foreground",
                    status === 'current' && "border-primary text-primary bg-background",
                    status === 'upcoming' && "border-muted-foreground/30 text-muted-foreground",
                    isClickable && "hover:border-primary/50 cursor-pointer",
                    !isClickable && "cursor-not-allowed"
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </button>
                <div className="ml-3">
                  <p className={cn(
                    "text-sm font-medium",
                    status === 'current' && "text-primary",
                    status === 'completed' && "text-foreground",
                    status === 'upcoming' && "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>

              {stepIdx < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-4 transition-colors",
                  stepIdx + 1 < state.currentStep ? "bg-primary" : "bg-muted-foreground/30"
                )} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}