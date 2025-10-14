import React from 'react';
import { Check, Users, Calendar, MapPin, Truck, Boxes, ClipboardCheck, ListChecks, DollarSign } from 'lucide-react';
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
    title: 'Deposit',
    description: 'Payment options',
    icon: DollarSign,
  },
  {
    number: 7,
    title: 'Review',
    description: 'Confirm & create',
    icon: ListChecks,
  },
];

export function WizardNavigation() {
  const { state, goToStep } = useJobWizard();

  const getStepStatus = (stepNumber: number) => {
    // For step 5 (Products), handle different job types
    if (stepNumber === 5) {
      // Service and survey jobs: Skip step 5 entirely, show as completed once past step 4
      if (state.data.job_type === 'service' || state.data.job_type === 'on-site-survey') {
        return state.currentStep > 4 ? 'completed' : 'upcoming';
      }
      
      // Pickup jobs: Step 5 is the equipment selection step
      if (state.data.job_type === 'pickup') {
        if (state.currentStep > 5) return 'completed';
        if (state.currentStep === 5) return 'current';
        return 'upcoming';
      }
      
      // Delivery jobs: Step 5 is current for both steps 5 and 6
      if (state.currentStep > 6) return 'completed'; // Past both sub-steps
      if (state.currentStep === 5 || state.currentStep === 6) return 'current'; // In either sub-step
      return 'upcoming';
    }
    
    // For step 6 (Deposit), map to actual step numbers
    if (stepNumber === 6) {
      // Pickup jobs: Deposit at step 6
      if (state.data.job_type === 'pickup') {
        if (state.currentStep === 6) return 'current';
        if (state.currentStep > 6) return 'completed';
        return 'upcoming';
      }
      
      // Other jobs: Deposit at step 7
      if (state.currentStep === 7) return 'current';
      if (state.currentStep > 7) return 'completed';
      return 'upcoming';
    }
    
    // For step 7 (Review), map to the actual step numbers
    if (stepNumber === 7) {
      // Pickup jobs: Review at step 7
      if (state.data.job_type === 'pickup') {
        if (state.currentStep === 7) return 'current';
        if (state.currentStep > 7) return 'completed';
        return 'upcoming';
      }
      
      // Other jobs: Review at step 8
      if (state.currentStep === 8) return 'current';
      if (state.currentStep > 8) return 'completed';
      return 'upcoming';
    }
    
    // Standard step logic for other steps
    if (stepNumber < state.currentStep) return 'completed';
    if (stepNumber === state.currentStep) return 'current';
    return 'upcoming';
  };

  const isStepClickable = (stepNumber: number) => {
    // Step 5 (Products): Not clickable for service and survey jobs (they skip this step)
    if (stepNumber === 5) {
      if (state.data.job_type === 'service' || state.data.job_type === 'on-site-survey') return false; // Never clickable for service/survey jobs
      if (state.currentStep === 6 && state.data.job_type !== 'pickup') return false; // Don't allow going back to products during services for delivery jobs
      return stepNumber <= state.currentStep;
    }
    
    // For step 6 (Deposit), handle different job types
    if (stepNumber === 6) {
      // Deposit is accessible when we reach step 6 for pickup or step 7 for others
      if (state.data.job_type === 'pickup') {
        return state.currentStep >= 6;
      }
      return state.currentStep >= 7;
    }
    
    // For step 7 (Review), handle different job types
    if (stepNumber === 7) {
      // Review is accessible when we reach step 7 for pickup or step 8 for others
      if (state.data.job_type === 'pickup') {
        return state.currentStep >= 7;
      }
      return state.currentStep >= 8;
    }
    
    // Standard clickability logic
    return stepNumber <= state.currentStep;
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
                      // Handle clicking on steps - map display numbers to actual wizard steps
                      let targetStep = step.number;
                      
                      if (step.number === 6) {
                        // Deposit step
                        targetStep = state.data.job_type === 'pickup' ? 6 : 7;
                      } else if (step.number === 7) {
                        // Review step  
                        targetStep = state.data.job_type === 'pickup' ? 7 : 8;
                      }
                      
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