
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomerStep } from './steps/CustomerStep';
import { JobTypeStep } from './steps/JobTypeStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { ConsumablesPricingStep } from './steps/ConsumablesPricingStep';
import { LocationStep } from './steps/LocationStep';
import { DriverVehicleStep } from './steps/DriverVehicleStep';
import { ReviewStep } from './steps/ReviewStep';
import { useCreateJob } from '@/hooks/useJobs';

interface JobCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobCreationWizard: React.FC<JobCreationWizardProps> = ({
  open,
  onOpenChange
}) => {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    customer: null as any,
    jobType: null as 'delivery' | 'pickup' | 'service' | null,
    dateTime: {
      date: null as Date | null,
      time: '09:00',
      timezone: 'America/New_York'
    },
    consumables: {
      billingMethod: 'per-use' as 'per-use' | 'bundle' | 'subscription',
      items: [] as Array<{
        id: string;
        consumableId: string;
        name: string;
        quantity: number;
        unitPrice: number;
        total: number;
        stockAvailable: number;
      }>,
      selectedBundle: null as string | null,
      subscriptionEnabled: false,
      subtotal: 0
    },
    location: {
      address: '',
      coordinates: null as { lat: number; lng: number } | null,
      specialInstructions: ''
    },
    assignment: {
      driverId: null as string | null,
      vehicleId: null as string | null
    },
    equipment: {
      items: [] as Array<{
        id: string;
        name: string;
        quantity: number;
        type: 'equipment' | 'service';
      }>
    }
  });

  const createJobMutation = useCreateJob();

  const steps = [
    { id: 1, title: 'Customer', component: CustomerStep },
    { id: 2, title: 'Job Type', component: JobTypeStep },
    { id: 3, title: 'Date & Time', component: DateTimeStep },
    { id: 4, title: 'Consumables & Pricing', component: ConsumablesPricingStep },
    { id: 5, title: 'Location', component: LocationStep },
    { id: 6, title: 'Assignment', component: DriverVehicleStep },
    { id: 7, title: 'Review', component: ReviewStep }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);
  const StepComponent = currentStepData?.component;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.customer !== null;
      case 2: return formData.jobType !== null;
      case 3: return formData.dateTime.date !== null;
      case 4: return (
        (formData.consumables.billingMethod === 'per-use' && formData.consumables.items.length > 0) ||
        (formData.consumables.billingMethod === 'bundle' && formData.consumables.selectedBundle !== null) ||
        (formData.consumables.billingMethod === 'subscription' && formData.consumables.subscriptionEnabled)
      );
      case 5: return formData.location.address.length > 0;
      case 6: return true; // Assignment is optional
      case 7: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepEdit = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const handleSubmit = async () => {
    if (!formData.customer || !formData.jobType || !formData.dateTime.date) {
      return;
    }

    const jobData = {
      customer_id: formData.customer.id,
      job_type: formData.jobType,
      scheduled_date: formData.dateTime.date.toISOString().split('T')[0],
      scheduled_time: formData.dateTime.time,
      notes: formData.location.specialInstructions || undefined,
      special_instructions: formData.location.specialInstructions || undefined,
      driver_id: formData.assignment.driverId || undefined,
      vehicle_id: formData.assignment.vehicleId || undefined,
      timezone: formData.dateTime.timezone,
      billing_method: formData.consumables.billingMethod,
      subscription_plan: formData.consumables.subscriptionEnabled ? 'unlimited_consumables' : undefined,
      consumables_data: formData.consumables
    };

    await createJobMutation.mutateAsync(jobData);
    onOpenChange(false);
    
    // Reset form
    setCurrentStep(1);
    setFormData({
      customer: null,
      jobType: null,
      dateTime: {
        date: null,
        time: '09:00',
        timezone: 'America/New_York'
      },
      consumables: {
        billingMethod: 'per-use',
        items: [],
        selectedBundle: null,
        subscriptionEnabled: false,
        subtotal: 0
      },
      location: {
        address: '',
        coordinates: null,
        specialInstructions: ''
      },
      assignment: {
        driverId: null,
        vehicleId: null
      },
      equipment: {
        items: []
      }
    });
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className={`${isMobile ? 'w-full' : 'w-1/2'} max-w-none overflow-y-auto`}
      >
        {/* Close Button */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <SheetHeader className="space-y-3 pr-12">
          <SheetTitle className="text-xl font-semibold">Create New Job</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {currentStepData?.title}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="flex-1">
            {StepComponent && (
              <StepComponent
                data={
                  currentStep === 1 ? formData.customer :
                  currentStep === 2 ? formData.jobType :
                  currentStep === 3 ? formData.dateTime :
                  currentStep === 4 ? formData.consumables :
                  currentStep === 5 ? formData.location :
                  currentStep === 6 ? formData.assignment :
                  formData
                }
                onUpdate={(value: any) => {
                  const fieldMap = {
                    1: 'customer',
                    2: 'jobType',
                    3: 'dateTime',
                    4: 'consumables',
                    5: 'location',
                    6: 'assignment'
                  };
                  
                  if (currentStep === 7) {
                    // Review step doesn't update, just calls edit
                    return;
                  }
                  
                  const field = fieldMap[currentStep as keyof typeof fieldMap];
                  updateFormData(field, value);
                }}
                onEdit={currentStep === 7 ? handleStepEdit : undefined}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex space-x-2">
              {currentStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || createJobMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
