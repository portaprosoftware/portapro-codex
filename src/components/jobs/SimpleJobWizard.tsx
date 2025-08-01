import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useCreateJob } from '@/hooks/useJobs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Step Components
import { CustomerStep } from './steps/CustomerStep';
import { JobTypeTimezoneStep } from './steps/enhanced/JobTypeTimezoneStep';
import { SimpleDateTimeStep } from './steps/SimpleDateTimeStep';
import { LocationStep } from './steps/LocationStep';

interface SimpleJobData {
  // Customer
  customer: any;
  
  // Job Type & Scheduling
  jobType: 'delivery' | 'pickup' | 'service' | 'on-site-survey' | '';
  timezone: string;
  date: string;
  time: string;
  
  // Location
  address: string;
  coordinates: { lat: number; lng: number; } | null;
  specialInstructions: string;
}

interface SimpleJobWizardProps {
  customerId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 'customer', title: 'Select Customer', description: 'Choose the customer for this job' },
  { id: 'job-details', title: 'Job Details', description: 'Set job type and timezone' },
  { id: 'scheduling', title: 'Schedule', description: 'Set date and time for the service' },
  { id: 'location', title: 'Service Location', description: 'Specify where the service will be performed' }
];

export const SimpleJobWizard: React.FC<SimpleJobWizardProps> = ({
  customerId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<SimpleJobData>({
    customer: null,
    jobType: '',
    timezone: '',
    date: '',
    time: '',
    address: '',
    coordinates: null,
    specialInstructions: ''
  });

  const createJobMutation = useCreateJob();

  // Fetch company settings for default address
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_street, company_street2, company_city, company_state, company_zipcode')
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Pre-populate address when reaching step 3 and no address is set
  useEffect(() => {
    if (currentStep === 3 && !data.address && companySettings) {
      const companyAddress = [
        companySettings.company_street,
        companySettings.company_street2,
        companySettings.company_city,
        companySettings.company_state,
        companySettings.company_zipcode
      ].filter(Boolean).join(', ');
      
      if (companyAddress) {
        updateStepData({ address: companyAddress });
      }
    }
  }, [currentStep, data.address, companySettings]);

  const updateStepData = (stepData: Partial<SimpleJobData>) => {
    setData(prev => ({ ...prev, ...stepData }));
  };

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case 0: // Customer
        return !!data.customer;
      case 1: // Job Details
        return !!(data.jobType && data.timezone);
      case 2: // Scheduling
        return !!(data.date && data.time);
      case 3: // Location
        return !!data.address;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!canProceedToNext()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create simplified job data using only fields that exist in the jobs table
      const jobData = {
        customer_id: data.customer.id,
        job_type: data.jobType as 'delivery' | 'pickup' | 'service' | 'on-site-survey',
        scheduled_date: data.date,
        scheduled_time: data.time,
        timezone: data.timezone,
        special_instructions: data.specialInstructions,
        status: 'scheduled' as const
      };

      await createJobMutation.mutateAsync(jobData);
      toast.success('Job created successfully!');
      onComplete();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job. Please try again.');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CustomerStep
            data={data.customer}
            onUpdate={(customer) => updateStepData({ customer })}
          />
        );
      case 1:
        return (
          <JobTypeTimezoneStep
            data={{
              jobType: data.jobType as 'delivery' | 'pickup' | 'service' | 'on-site-survey' | null,
              timezone: data.timezone,
              customerZip: data.customer?.service_zip || data.customer?.zip || '',
              customerState: data.customer?.service_state || data.customer?.state || ''
            }}
            onUpdate={(jobDetails) => updateStepData({
              jobType: jobDetails.jobType || '',
              timezone: jobDetails.timezone
            })}
          />
        );
      case 2:
        return (
          <SimpleDateTimeStep
            data={{
              date: data.date,
              time: data.time
            }}
            onUpdate={(dateTime) => updateStepData(dateTime)}
          />
        );
      case 3:
        return (
          <LocationStep
            data={{
              address: data.address,
              coordinates: data.coordinates,
              specialInstructions: data.specialInstructions
            }}
            onUpdate={(location) => updateStepData({
              address: location.address,
              coordinates: location.coordinates,
              specialInstructions: location.specialInstructions
            })}
          />
        );
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            Create New Job
          </CardTitle>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">{STEPS[currentStep].title}</h3>
            <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderCurrentStep()}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onCancel : handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={!canProceedToNext() || createJobMutation.isPending}
                className="flex items-center gap-2"
              >
                {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                <CheckCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};