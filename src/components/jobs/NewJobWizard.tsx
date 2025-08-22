import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { X, Plus } from 'lucide-react';
import { JobWizardProvider, useJobWizard } from '@/contexts/JobWizardContext';
import { WizardNavigation } from './WizardNavigation';
import { CustomerSelectionStep } from './steps/CustomerSelectionStep';
import { JobTypeSchedulingStep } from './steps/JobTypeSchedulingStep';
import { LocationSelectionStep } from './steps/LocationSelectionStep';
import { useCreateJob } from '@/hooks/useJobs';
import { useCreateQuote } from '@/hooks/useCreateQuote';
import { toast } from 'sonner';
import { DriverVehicleStep } from './steps/DriverVehicleStep';
import { ProductsServicesStep } from './steps/ProductsServicesStep';
import { ServicesFrequencyOnlyStep } from './steps/ServicesFrequencyOnlyStep';
import { ReviewConfirmationStep } from './steps/ReviewConfirmationStep';
import { QuotePreviewStep, QuoteSendOptions } from './steps/QuotePreviewStep';
import { supabase } from '@/integrations/supabase/client';
import { JobExitConfirmation } from './JobExitConfirmation';
import { QuoteExitConfirmation } from '@/components/quotes/QuoteExitConfirmation';
import { useJobDrafts } from '@/hooks/useJobDrafts';
import { useQuoteDrafts } from '@/hooks/useQuoteDrafts';

interface NewJobWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftData?: any;
  initialMode?: 'job' | 'quote' | 'job_and_quote';
  wizardMode?: 'job' | 'quote';
}

function WizardContent({ onClose, wizardMode = 'job' }: { onClose: () => void; wizardMode?: 'job' | 'quote' }) {
  const { state, nextStep, previousStep, validateCurrentStep, reset } = useJobWizard();
  const { saveDraft: saveJobDraft, isSaving: isSavingJob } = useJobDrafts();
  const { saveDraft: saveQuoteDraft, isSaving: isSavingQuote } = useQuoteDrafts();
  
  const saveDraft = wizardMode === 'quote' ? saveQuoteDraft : saveJobDraft;
  const isSaving = wizardMode === 'quote' ? isSavingQuote : isSavingJob;
  const createJobMutation = useCreateJob();
  const createQuoteMutation = useCreateQuote();
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const handleSaveAndExit = async (draftName: string) => {
    try {
      const draftType = wizardMode === 'quote' ? 'quote' : 'job';
      console.log(`Saving ${draftType} draft with name:`, draftName);
      console.log('Current wizard data:', state.data);
      
      await saveDraft(draftName, state.data);
      toast.success(`${draftType === 'quote' ? 'Quote' : 'Job'} draft saved successfully`);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    }
  };

  const handleDeleteAndExit = () => {
    console.log('Deleting draft and exiting');
    reset();
    onClose();
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
    // Errors are already set in validateCurrentStep
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleCreateJob = async () => {
    if (!validateCurrentStep()) return;

    try {
      console.log('Job wizard calling createJob with data:', state.data);
      const job = await createJobMutation.mutateAsync(state.data);

      // Create pickup job if requested
      let pickupJob = null;
      if (state.data.create_pickup_job && state.data.pickup_date) {
        // Use specific pickup inventory selections if available, otherwise use all delivery items
        const pickupItems = state.data.pickup_inventory_selections?.main_pickup || state.data.items;
        
        const pickupJobData = {
          customer_id: state.data.customer_id,
          job_type: 'pickup' as const,
          scheduled_date: state.data.pickup_date,
          scheduled_time: state.data.pickup_time,
          timezone: state.data.timezone,
          notes: state.data.pickup_notes || '',
          is_priority: state.data.pickup_is_priority || false,
          selected_coordinate_ids: state.data.selected_coordinate_ids,
          driver_id: state.data.driver_id,
          vehicle_id: state.data.vehicle_id,
          items: pickupItems,
          create_daily_assignment: state.data.create_daily_assignment,
        };
        
        console.log('Creating pickup job with data:', pickupJobData);
        pickupJob = await createJobMutation.mutateAsync(pickupJobData);
      }

      // Create partial pickup jobs if requested
      const partialPickupJobs = [];
      if (state.data.create_partial_pickups && state.data.partial_pickups) {
        for (const partialPickup of state.data.partial_pickups) {
          if (partialPickup.date) {
            // Use specific partial pickup inventory selections if available, otherwise use all delivery items
            const partialPickupItems = state.data.pickup_inventory_selections?.partial_pickups?.[partialPickup.id] || state.data.items;
            
            const partialPickupJobData = {
              customer_id: state.data.customer_id,
              job_type: 'pickup' as const,
              scheduled_date: partialPickup.date,
              scheduled_time: partialPickup.time,
              timezone: state.data.timezone,
              notes: partialPickup.notes ? `PARTIAL PICKUP: ${partialPickup.notes}` : 'PARTIAL PICKUP',
              is_priority: partialPickup.is_priority || false,
              selected_coordinate_ids: state.data.selected_coordinate_ids,
              driver_id: state.data.driver_id,
              vehicle_id: state.data.vehicle_id,
              items: partialPickupItems,
              create_daily_assignment: state.data.create_daily_assignment,
            };
            
            console.log('Creating partial pickup job with data:', partialPickupJobData);
            const partialJob = await createJobMutation.mutateAsync(partialPickupJobData);
            partialPickupJobs.push(partialJob);
          }
        }
      }

      // Note: Inventory items are now handled directly in useCreateJob hook

      // Insert service job items if any services were selected
      if (state.data.servicesData && state.data.servicesData.selectedServices?.length) {
        const serviceItems = state.data.servicesData.selectedServices.map((s: any) => ({
          job_id: job.id,
          line_item_type: 'service',
          service_id: s.id,
          service_frequency: s.frequency,
          service_hours: s.estimated_duration_hours ?? null,
          service_config: {
            pricing_method: s.pricing_method,
            custom_type: s.custom_type,
            custom_frequency_days: s.custom_frequency_days,
            custom_days_of_week: s.custom_days_of_week,
            calculated_cost: s.calculated_cost,
          },
          service_custom_dates: Array.isArray(s.custom_specific_dates)
            ? s.custom_specific_dates.map((d: any) => ({
                date: d?.date instanceof Date ? d.date.toISOString() : d?.date,
                time: d?.time || null,
                notes: d?.notes || null,
              }))
            : null,
          unit_price: Number(s.calculated_cost || 0),
          total_price: Number(s.calculated_cost || 0),
          quantity: 1,
        }));
        const { error: svcError } = await supabase.from('job_items').insert(serviceItems);
        if (svcError) throw svcError;
      }

      // Equipment assignments are now handled in useCreateJob hook
      
      // Optionally create daily driver+vehicle assignment
      try {
        if (state.data.create_daily_assignment && state.data.driver_id && state.data.vehicle_id && state.data.scheduled_date) {
          const date = state.data.scheduled_date;
          const { data: existing, error: checkError } = await supabase
            .from('daily_vehicle_assignments')
            .select('id')
            .eq('assignment_date', date)
            .or(`driver_id.eq.${state.data.driver_id},vehicle_id.eq.${state.data.vehicle_id}`)
            .maybeSingle();
          if (!checkError && !existing) {
            const { error: insertError } = await supabase.from('daily_vehicle_assignments').insert({
              driver_id: state.data.driver_id,
              vehicle_id: state.data.vehicle_id,
              assignment_date: date,
              notes: `Auto-assigned for job ${job.id}`,
            });
            if (insertError) {
              console.warn('Daily assignment insert failed:', insertError);
              toast.warning('Job created, but daily assignment could not be created.');
            }
          }
        }
      } catch (e) {
        console.warn('Daily assignment step skipped due to error:', e);
      }

      const totalJobsCreated = 1 + (pickupJob ? 1 : 0) + partialPickupJobs.length;
      const jobsCreated = totalJobsCreated > 1 ? `${totalJobsCreated} jobs created successfully!` : 'Job created successfully!';
      toast.success(jobsCreated);
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job. Please try again.');
    }
  };

  const handleCreateQuote = async (sendOptions?: QuoteSendOptions) => {
    if (!validateCurrentStep()) return;

    try {
      console.log('Creating quote with wizard data:', state.data);
      console.log('Send options:', sendOptions);
      
      let status = 'pending';
      if (sendOptions?.method === 'save_draft') {
        status = 'draft';
      } else if (sendOptions?.method === 'email' || sendOptions?.method === 'sms') {
        status = 'sent';
      }
      
      const quote = await createQuoteMutation.mutateAsync({
        wizardData: state.data,
        status: status as 'pending' | 'sent' | 'accepted' | 'declined' | 'expired'
      });

      console.log('Quote created successfully:', quote);
      
      if (sendOptions?.method === 'save_draft') {
        toast.success('Quote saved as draft!');
      } else if (sendOptions?.method === 'email' || sendOptions?.method === 'sms') {
        toast.success('Quote created and sent successfully!');
      } else {
        toast.success('Quote created successfully!');
      }
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating quote:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(`Failed to create quote: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleSaveDraft = () => {
    handleCreateQuote({ method: 'save_draft', sendImmediately: false });
  };

  const handleCreateJobAndQuote = async () => {
    if (!validateCurrentStep()) return;

    try {
      console.log('Creating both job and quote with wizard data:', state.data);
      
      // Create quote first
      const quote = await createQuoteMutation.mutateAsync({
        wizardData: state.data,
        status: 'sent'
      });

      // Create job - need to handle quote_id separately since it's not in JobWizardData
      const jobData = { ...state.data };
      const job = await createJobMutation.mutateAsync(jobData);
      
      // Link the job to the quote after creation
      if (quote.id) {
        await supabase
          .from('jobs')
          .update({ quote_id: quote.id })
          .eq('id', job.id);
      }

      // Create pickup job if requested
      let pickupJob = null;
      if (state.data.create_pickup_job && state.data.pickup_date) {
        const pickupItems = state.data.pickup_inventory_selections?.main_pickup || state.data.items;
        
        const pickupJobData = {
          customer_id: state.data.customer_id,
          job_type: 'pickup' as const,
          scheduled_date: state.data.pickup_date,
          scheduled_time: state.data.pickup_time,
          timezone: state.data.timezone,
          notes: state.data.pickup_notes || '',
          is_priority: state.data.pickup_is_priority || false,
          selected_coordinate_ids: state.data.selected_coordinate_ids,
          driver_id: state.data.driver_id,
          vehicle_id: state.data.vehicle_id,
          items: pickupItems,
          create_daily_assignment: state.data.create_daily_assignment,
        };
        
        pickupJob = await createJobMutation.mutateAsync(pickupJobData);
      }

      // Create partial pickup jobs if requested
      const partialPickupJobs = [];
      if (state.data.create_partial_pickups && state.data.partial_pickups) {
        for (const partialPickup of state.data.partial_pickups) {
          if (partialPickup.date) {
            const partialPickupItems = state.data.pickup_inventory_selections?.partial_pickups?.[partialPickup.id] || state.data.items;
            
            const partialPickupJobData = {
              customer_id: state.data.customer_id,
              job_type: 'pickup' as const,
              scheduled_date: partialPickup.date,
              scheduled_time: partialPickup.time,
              timezone: state.data.timezone,
              notes: partialPickup.notes ? `PARTIAL PICKUP: ${partialPickup.notes}` : 'PARTIAL PICKUP',
              is_priority: partialPickup.is_priority || false,
              selected_coordinate_ids: state.data.selected_coordinate_ids,
              driver_id: state.data.driver_id,
              vehicle_id: state.data.vehicle_id,
              items: partialPickupItems,
              create_daily_assignment: state.data.create_daily_assignment,
            };
            
            const partialJob = await createJobMutation.mutateAsync(partialPickupJobData);
            partialPickupJobs.push(partialJob);
          }
        }
      }

      // Handle services if any
      if (state.data.servicesData && state.data.servicesData.selectedServices?.length) {
        const serviceItems = state.data.servicesData.selectedServices.map((s: any) => ({
          job_id: job.id,
          line_item_type: 'service',
          service_id: s.id,
          service_frequency: s.frequency,
          service_hours: s.estimated_duration_hours ?? null,
          service_config: {
            pricing_method: s.pricing_method,
            custom_type: s.custom_type,
            custom_frequency_days: s.custom_frequency_days,
            custom_days_of_week: s.custom_days_of_week,
            calculated_cost: s.calculated_cost,
          },
          service_custom_dates: Array.isArray(s.custom_specific_dates)
            ? s.custom_specific_dates.map((d: any) => ({
                date: d?.date instanceof Date ? d.date.toISOString() : d?.date,
                time: d?.time || null,
                notes: d?.notes || null,
              }))
            : null,
          unit_price: Number(s.calculated_cost || 0),
          total_price: Number(s.calculated_cost || 0),
          quantity: 1,
        }));
        const { error: svcError } = await supabase.from('job_items').insert(serviceItems);
        if (svcError) throw svcError;
      }

      // Create daily assignment if needed
      try {
        if (state.data.create_daily_assignment && state.data.driver_id && state.data.vehicle_id && state.data.scheduled_date) {
          const date = state.data.scheduled_date;
          const { data: existing, error: checkError } = await supabase
            .from('daily_vehicle_assignments')
            .select('id')
            .eq('assignment_date', date)
            .or(`driver_id.eq.${state.data.driver_id},vehicle_id.eq.${state.data.vehicle_id}`)
            .maybeSingle();
          if (!checkError && !existing) {
            const { error: insertError } = await supabase.from('daily_vehicle_assignments').insert({
              driver_id: state.data.driver_id,
              vehicle_id: state.data.vehicle_id,
              assignment_date: date,
              notes: `Auto-assigned for job ${job.id}`,
            });
            if (insertError) {
              console.warn('Daily assignment insert failed:', insertError);
            }
          }
        }
      } catch (e) {
        console.warn('Daily assignment step skipped due to error:', e);
      }

      const totalJobsCreated = 1 + (pickupJob ? 1 : 0) + partialPickupJobs.length;
      toast.success(`Quote and ${totalJobsCreated} job${totalJobsCreated > 1 ? 's' : ''} created successfully!`);
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating quote and job:', error);
      toast.error('Failed to create quote and job. Please try again.');
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
        // Skip Products & Inventory step for service jobs
        if (state.data.job_type === 'service') {
          return <ServicesFrequencyOnlyStep />;
        }
        return <ProductsServicesStep />;
      case 6:
        // Service jobs show services at step 6, pickup jobs skip to review
        if (state.data.job_type === 'service') {
          return <ServicesFrequencyOnlyStep />;
        }
        if (state.data.job_type === 'pickup') {
          return (
            <ReviewConfirmationStep 
              onCreateJob={handleCreateJob} 
              onCreateQuote={handleCreateQuote}
              onCreateJobAndQuote={handleCreateJobAndQuote}
              creating={createJobMutation.isPending}
              creatingQuote={createQuoteMutation.isPending}
              creatingJobAndQuote={createJobMutation.isPending || createQuoteMutation.isPending}
            />
          );
        }
        return <ServicesFrequencyOnlyStep />;
      case 7:
        // For quotes, show preview step, otherwise show review
        if (wizardMode === 'quote') {
          return (
            <QuotePreviewStep
              onSendQuote={handleCreateQuote}
              onSaveDraft={handleSaveDraft}
              sending={createQuoteMutation.isPending}
            />
          );
        }
        return (
          <ReviewConfirmationStep 
            onCreateJob={handleCreateJob} 
            onCreateQuote={handleCreateQuote}
            onCreateJobAndQuote={handleCreateJobAndQuote}
            creating={createJobMutation.isPending}
            creatingQuote={createQuoteMutation.isPending}
            creatingJobAndQuote={createJobMutation.isPending || createQuoteMutation.isPending}
          />
        );
      default:
        return <CustomerSelectionStep />;
    }
  };

  const isLastStep = state.currentStep === 7;
  const isFirstStep = state.currentStep === 1;

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      <DrawerHeader className="flex flex-row items-center justify-start space-y-0 pb-2 border-b">
        <DrawerTitle className="text-xl font-semibold flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {state.wizardMode === 'quote' ? 'Create New Quote' : 
           state.wizardMode === 'job_and_quote' ? 'Create Job & Quote' : 
           'Create New Job'}
        </DrawerTitle>
      </DrawerHeader>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <WizardNavigation />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {renderCurrentStep()}
        </div>

        <div className="p-4 border-t bg-muted/20 flex flex-col">
          {/* Validation errors above buttons */}
          {Object.keys(state.errors).length > 0 && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-xs font-medium">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Please complete the following:
                  </p>
                  <ul className="text-sm text-destructive/80 space-y-1">
                    {Object.entries(state.errors).map(([field, message]) => (
                      <li key={field} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-destructive/60 flex-shrink-0 mt-2"></span>
                        {message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                console.log('Close wizard clicked, current data:', state.data);
                console.log('Has any data?', Object.keys(state.data).length > 0);
                console.log('Setting showExitConfirmation to true');
                setShowExitConfirmation(true);
                console.log('showExitConfirmation should now be:', true);
              }}
            >
              Close Wizard
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
              >
                Previous
              </Button>
              
              {isLastStep ? (
                // In quote mode, ReviewConfirmationStep handles the buttons
                state.wizardMode === 'quote' ? null : (
                  <Button
                    onClick={handleCreateJob}
                    disabled={createJobMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                  </Button>
                )
              ) : (
                <Button onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {wizardMode === 'quote' ? (
        <QuoteExitConfirmation
          isOpen={showExitConfirmation}
          onClose={() => {
            console.log('QuoteExitConfirmation onClose called');
            setShowExitConfirmation(false);
          }}
          onSaveAndExit={handleSaveAndExit}
          onDeleteAndExit={handleDeleteAndExit}
          isSaving={isSaving}
        />
      ) : (
        <JobExitConfirmation
          isOpen={showExitConfirmation}
          onClose={() => {
            console.log('JobExitConfirmation onClose called');
            setShowExitConfirmation(false);
          }}
          onSaveAndExit={handleSaveAndExit}
          onDeleteAndExit={handleDeleteAndExit}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

export function NewJobWizard({ open, onOpenChange, draftData, initialMode, wizardMode = 'job' }: NewJobWizardProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  // Use wizardMode consistently - it should be the same as initialMode
  const mode = (wizardMode || initialMode || 'job') as 'job' | 'quote';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-0" aria-describedby="new-job-wizard-description">
        <div id="new-job-wizard-description" className="sr-only">
          {mode === 'quote' ? 'Create a new quote by following the wizard steps' : 'Create a new job by following the wizard steps'}
        </div>
        <JobWizardProvider initialDraftData={draftData} initialMode={mode}>
          <WizardContent onClose={handleClose} wizardMode={mode} />
        </JobWizardProvider>
      </DrawerContent>
    </Drawer>
  );
}