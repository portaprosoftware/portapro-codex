import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const ServicesFrequencyOnlyStep: React.FC = () => {
  const { state, updateData, previousStep } = useJobWizard();

  return (
    <div className="space-y-6">
      {/* Back to Products Navigation */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={previousStep}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
        <div className="text-sm text-muted-foreground">
          Step 2 of 2: Services & Frequency
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Services & Frequency</h3>
        <p className="text-muted-foreground">
          Select additional services and configure their frequency for this job.
        </p>
        
        {/* Services selection UI would go here */}
        <div className="p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center">
          <p className="text-muted-foreground">
            Services configuration interface coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};