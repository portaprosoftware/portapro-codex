import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { ServicesFrequencyStep } from '@/components/jobs/steps/enhanced/ServicesFrequencyStep';

export const ServicesFrequencyOnlyStep: React.FC = () => {
  const { state, updateData } = useJobWizard();

  return (
    <div className="space-y-6">
      <ServicesFrequencyStep
        data={state.data.servicesData || { selectedServices: [], servicesSubtotal: 0 }}
        onUpdate={(svc) => updateData({ servicesData: svc })}
      />
    </div>
  );
};