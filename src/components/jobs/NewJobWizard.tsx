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
import { DriverVehicleStep } from './steps/DriverVehicleStep';
import { ProductsServicesStep } from './steps/ProductsServicesStep';
import { ReviewConfirmationStep } from './steps/ReviewConfirmationStep';
import { supabase } from '@/integrations/supabase/client';

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
      const job = await createJobMutation.mutateAsync(state.data);

      // Insert job items if any
      if (state.data.items && state.data.items.length > 0) {
        const jobItems = state.data.items.map(it => ({
          job_id: job.id,
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: 0,
          total_price: 0,
          line_item_type: 'inventory',
        }));
        const { error: itemsError } = await supabase.from('job_items').insert(jobItems);
        if (itemsError) throw itemsError;
      }

      // After job is created, reserve equipment if any items were selected
      if (state.data.items && state.data.items.length > 0 && state.data.scheduled_date) {
        const assignmentDate = state.data.scheduled_date;
        const returnDate = state.data.return_date || null;

        for (const item of state.data.items) {
          if (item.strategy === 'bulk') {
            const { data, error } = await supabase.rpc('reserve_equipment_for_job', {
              job_uuid: job.id,
              product_uuid: item.product_id,
              reserve_quantity: item.quantity,
              assignment_date: assignmentDate,
              return_date: returnDate
            });
            if (error) {
              throw new Error(error.message || 'Failed to reserve equipment');
            }

          } else if (item.strategy === 'specific' && item.specific_item_ids?.length) {
            for (const itemId of item.specific_item_ids) {
              const { data, error } = await supabase.rpc('reserve_specific_item_for_job', {
                job_uuid: job.id,
                item_uuid: itemId,
                assignment_date: assignmentDate,
                return_date: returnDate
              });
              if (error) {
                throw new Error(error.message || 'Failed to reserve specific item');
              }
            }
          }
        }
      }

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
      case 4:
        return <DriverVehicleStep />;
      case 5:
        return <ProductsServicesStep />;
      case 6:
        return <ReviewConfirmationStep onCreateJob={handleCreateJob} creating={createJobMutation.isPending} />;
      default:
        return <CustomerSelectionStep />;
    }
  };

  const isLastStep = state.currentStep === 6;
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