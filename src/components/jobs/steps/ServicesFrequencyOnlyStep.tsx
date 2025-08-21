import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { ServicesFrequencyStep } from '@/components/jobs/steps/enhanced/ServicesFrequencyStep';

export const ServicesFrequencyOnlyStep: React.FC = () => {
  const { state, updateData, previousStep } = useJobWizard();

  return (
    <div className="space-y-6">
      {/* Back to Products Navigation */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <Button
          variant="outline"
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

      {/* Actual Services Functionality */}
      <ServicesFrequencyStep
        data={{
          selectedServices: state.data.servicesData?.selectedServices || [],
          servicesSubtotal: state.data.servicesData?.servicesSubtotal || 0,
          useSameDriverForAll: state.data.servicesData?.useSameDriverForAll || false,
          useSameVehicleForAll: state.data.servicesData?.useSameVehicleForAll || false,
          groupAssignmentsByDay: state.data.servicesData?.groupAssignmentsByDay || false,
          dayAssignments: state.data.servicesData?.dayAssignments,
          individualServiceAssignments: state.data.servicesData?.individualServiceAssignments,
          expandedDays: state.data.servicesData?.expandedDays,
          scheduledDriverForAll: state.data.servicesData?.scheduledDriverForAll,
          scheduledVehicleForAll: state.data.servicesData?.scheduledVehicleForAll,
          package_override: state.data.servicesData?.package_override
        }}
        onUpdate={(svc) => updateData({ servicesData: svc })}
      />
    </div>
  );
};