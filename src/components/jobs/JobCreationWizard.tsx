
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomerStep } from './steps/CustomerStep';
import { JobTypeStep } from './steps/JobTypeStep';
import { DeliveryPickupScheduleStep } from './steps/enhanced/DeliveryPickupScheduleStep';
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
    schedule: {
      jobType: 'delivery' as 'delivery' | 'pickup' | 'service' | 'estimate',
      timezone: 'America/New_York',
      deliveryDate: null as Date | null,
      deliveryTime: '09:00',
      addDeliveryTime: false,
      returnScheduleEnabled: false,
      fullPickupDate: null as Date | null,
      fullPickupTime: '14:00',
      addFullPickupTime: false,
      partialPickupsEnabled: false,
      partialPickups: [] as Array<{
        id: string;
        date: Date | null;
        time: string;
        addTime: boolean;
        label: string;
      }>,
      serviceDate: null as Date | null,
      serviceTime: '09:00',
      addServiceTime: false
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
    { id: 3, title: 'Schedule', component: DeliveryPickupScheduleStep },
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
      case 3: {
        const { schedule } = formData;
        if (schedule.jobType === 'delivery') {
          return schedule.deliveryDate !== null;
        } else if (schedule.jobType === 'pickup') {
          return schedule.fullPickupDate !== null;
        } else if (schedule.jobType === 'service' || schedule.jobType === 'estimate') {
          return schedule.serviceDate !== null;
        }
        return false;
      }
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
    const { schedule } = formData;
    let primaryDate: Date | null = null;
    let primaryTime = '09:00';

    // Determine primary date based on job type
    if (schedule.jobType === 'delivery') {
      primaryDate = schedule.deliveryDate;
      primaryTime = schedule.addDeliveryTime ? schedule.deliveryTime : '09:00';
    } else if (schedule.jobType === 'pickup') {
      primaryDate = schedule.fullPickupDate;
      primaryTime = schedule.addFullPickupTime ? schedule.fullPickupTime : '09:00';
    } else if (schedule.jobType === 'service' || schedule.jobType === 'estimate') {
      primaryDate = schedule.serviceDate;
      primaryTime = schedule.addServiceTime ? schedule.serviceTime : '09:00';
    }

    if (!formData.customer || !formData.jobType || !primaryDate) {
      return;
    }

    const jobData = {
      customer_id: formData.customer.id,
      job_type: formData.jobType,
      scheduled_date: primaryDate.toISOString().split('T')[0],
      scheduled_time: primaryTime,
      notes: formData.location.specialInstructions || undefined,
      special_instructions: formData.location.specialInstructions || undefined,
      driver_id: formData.assignment.driverId || undefined,
      vehicle_id: formData.assignment.vehicleId || undefined,
      timezone: schedule.timezone,
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
      schedule: {
        jobType: 'delivery',
        timezone: 'America/New_York',
        deliveryDate: null,
        deliveryTime: '09:00',
        addDeliveryTime: false,
        returnScheduleEnabled: false,
        fullPickupDate: null,
        fullPickupTime: '14:00',
        addFullPickupTime: false,
        partialPickupsEnabled: false,
        partialPickups: [],
        serviceDate: null,
        serviceTime: '09:00',
        addServiceTime: false
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
        className={`${isMobile ? 'w-full' : 'w-3/4 sm:max-w-none'} max-w-none overflow-y-auto`}
      >
        <SheetHeader className="space-y-3">
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
                  currentStep === 3 ? { ...formData.schedule, jobType: formData.jobType || 'delivery' } :
                  currentStep === 4 ? formData.consumables :
                  currentStep === 5 ? formData.location :
                  currentStep === 6 ? formData.assignment :
                  formData
                }
                onUpdate={(value: any) => {
                  const fieldMap = {
                    1: 'customer',
                    2: 'jobType',
                    3: 'schedule',
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
