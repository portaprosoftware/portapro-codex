import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Plus } from 'lucide-react';
import { JobWizardProvider, useJobWizard } from '@/contexts/JobWizardContext';
import { WizardNavigation } from './WizardNavigation';
import { CustomerSelectionStep } from './steps/CustomerSelectionStep';
import { JobTypeSchedulingStep } from './steps/JobTypeSchedulingStep';
import { LocationSelectionStep } from './steps/LocationSelectionStep';
import { useCreateJob } from '@/hooks/useJobs';
import { toast } from 'sonner';

interface NewJobWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function WizardContent({ onClose }: { onClose: () => void }) {
  const { state, nextStep, previousStep, validateCurrentStep, reset } = useJobWizard();
  const createJobMutation = useCreateJob();

  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleCreateJob = async () => {
    if (!validateCurrentStep()) return;

    try {
      await createJobMutation.mutateAsync(state.data);
      toast.success('Job created successfully!');
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job. Please try again.');
    }
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <CustomerSelectionStep />;
      case 2:
        return <JobTypeSchedulingStep />;
      case 3:
        return <LocationSelectionStep />;
      default:
        return <CustomerSelectionStep />;
    }
  };

  const isLastStep = state.currentStep === 3;
  const isFirstStep = state.currentStep === 1;

  return (
    <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-center justify-start space-y-0 pb-2 border-b">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Job
        </CardTitle>
      </CardHeader>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <WizardNavigation />
        </div>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {renderCurrentStep()}
        </CardContent>

        <div className="p-4 border-t bg-muted/20 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            {isLastStep ? (
              <Button
                onClick={handleCreateJob}
                disabled={createJobMutation.isPending}
                className="min-w-[120px]"
              >
                {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function NewJobWizard({ open, onOpenChange }: NewJobWizardProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" aria-describedby="new-job-wizard-description">
        <div id="new-job-wizard-description" className="sr-only">
          Create a new job by following the wizard steps
        </div>
        <JobWizardProvider>
          <WizardContent onClose={handleClose} />
        </JobWizardProvider>
      </DialogContent>
    </Dialog>
  );
}