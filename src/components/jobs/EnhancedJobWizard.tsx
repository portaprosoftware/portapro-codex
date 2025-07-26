import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import all enhanced steps
import { CustomerStep } from './steps/CustomerStep';
import { JobTypeTimezoneStep } from './steps/enhanced/JobTypeTimezoneStep';
import { DeliveryPickupScheduleStep } from './steps/enhanced/DeliveryPickupScheduleStep';
import { LocationContactsStep } from './steps/enhanced/LocationContactsStep';
import { InventoryConsumablesStep } from './steps/enhanced/InventoryConsumablesStep';
import { ServicesFrequencyStep } from './steps/enhanced/ServicesFrequencyStep';
import { ServiceTemplateAssignmentStep } from './steps/enhanced/ServiceTemplateAssignmentStep';
import { CrewAssignmentStep } from './steps/enhanced/CrewAssignmentStep';
import { SpecialInstructionsReviewStep } from './steps/enhanced/SpecialInstructionsReviewStep';

// Combined wizard data interface
interface WizardData {
  // Step 1: Customer Selection
  selectedCustomer?: any;
  
  // Step 2: Job Type & Timezone
  jobType: 'delivery' | 'pickup' | 'service' | 'on-site-survey';
  timezone: string;
  customerTimezone: string;
  timezoneSource: 'company' | 'customer' | 'custom';
  
  // Step 3: Schedule
  deliveryDate?: Date;
  deliveryTime?: string;
  hasDeliveryTime: boolean;
  returnScheduleEnabled: boolean;
  fullPickupDate?: Date;
  fullPickupTime?: string;
  partialPickupEnabled: boolean;
  partialPickups: Array<{
    id: string;
    date: Date;
    time: string;
    addTime: boolean;
    label: string;
    quantity?: number;
    notes?: string;
  }>;
  serviceDate?: Date;
  serviceTime?: string;
  
  // Step 4: Location & Contacts
  selectedLocation?: any;
  customLocation?: {
    coordinates: { lat: number; lng: number } | null;
    address: string;
    saveToProfile: boolean;
  };
  selectedContacts: any[];
  
  // Step 5: Inventory & Consumables
  bulkItems: any[];
  selectSpecificUnits: boolean;
  selectedUnits: any[];
  addConsumables: boolean;
  consumablesBillingMethod: 'per-use' | 'bundle' | 'subscription';
  selectedConsumables: any[];
  selectedBundle: string | null;
  subscriptionEnabled: boolean;
  inventorySubtotal: number;
  consumablesSubtotal: number;
  
  // Step 6: Services & Frequency
  selectedServices: any[];
  servicesSubtotal: number;
  
  // Step 7: Service Template Assignment
  selectedTemplateIds: string[];
  defaultTemplateId?: string;
  
  // Step 8: Crew Assignment
  selectedDriver?: any;
  selectedVehicle?: any;
  hasConflicts: boolean;
  
  // Step 9: Special Instructions & Review
  specialInstructions: string;
  additionalContacts: any[];
  quickAddContact?: any;
}

interface EnhancedJobWizardProps {
  customerId?: string;
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: 'Select Customer', description: 'Choose the customer for this job' },
  { id: 2, title: 'Job Type & Timezone', description: 'Select job type and timezone' },
  { id: 3, title: 'Schedule', description: 'Set delivery and pickup dates' },
  { id: 4, title: 'Location & Contacts', description: 'Choose location and contacts' },
  { id: 5, title: 'Inventory & Consumables', description: 'Select equipment and supplies' },
  { id: 6, title: 'Services & Frequency', description: 'Add services and set frequency' },
  { id: 7, title: 'Service Templates', description: 'Assign report templates' },
  { id: 8, title: 'Crew Assignment', description: 'Assign driver and vehicle' },
  { id: 9, title: 'Review & Create', description: 'Final review and creation' }
];

export const EnhancedJobWizard: React.FC<EnhancedJobWizardProps> = ({
  customerId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    selectedCustomer: undefined,
    jobType: 'delivery',
    timezone: 'America/New_York',
    customerTimezone: 'America/New_York',
    timezoneSource: 'company',
    hasDeliveryTime: false,
    returnScheduleEnabled: false,
    partialPickupEnabled: false,
    partialPickups: [],
    selectedContacts: [],
    bulkItems: [],
    selectSpecificUnits: false,
    selectedUnits: [],
    addConsumables: false,
    consumablesBillingMethod: 'per-use',
    selectedConsumables: [],
    selectedBundle: null,
    subscriptionEnabled: false,
    inventorySubtotal: 0,
    consumablesSubtotal: 0,
    selectedServices: [],
    servicesSubtotal: 0,
    selectedTemplateIds: [],
    defaultTemplateId: undefined,
    hasConflicts: false,
    specialInstructions: '',
    additionalContacts: []
  });

  const [customerContacts, setCustomerContacts] = useState<any[]>([]);

  const updateStepData = (stepData: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...stepData }));
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return data.selectedCustomer;
      case 2:
        return data.jobType && data.timezone;
      case 3:
        // Validate based on job type
        if (data.jobType === 'delivery') {
          return data.deliveryDate && (!data.returnScheduleEnabled || data.fullPickupDate);
        } else if (data.jobType === 'pickup') {
          return data.fullPickupDate;
        } else if (data.jobType === 'service' || data.jobType === 'on-site-survey') {
          return data.serviceDate;
        }
        return true;
      case 4:
        return data.selectedLocation || (data.customLocation?.address && data.customLocation.address.length > 0);
      case 5:
        return true; // Optional step
      case 6:
        return true; // Optional step
      case 7:
        return true; // Optional step - service templates
      case 8:
        return !data.hasConflicts; // Cannot proceed with conflicts
      case 9:
        return true; // Final step
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete(data);
  };

  const getJobDates = () => {
    return {
      deliveryDate: data.deliveryDate,
      pickupDates: [
        data.fullPickupDate,
        ...data.partialPickups.map(p => p.date)
      ].filter(Boolean),
      serviceDate: data.serviceDate
    };
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerStep
            data={data.selectedCustomer}
            onUpdate={(customer) => updateStepData({ selectedCustomer: customer })}
          />
        );
      
      case 2:
        return (
          <JobTypeTimezoneStep
            data={{
              jobType: data.jobType,
              timezone: data.timezone
            }}
            onUpdate={(stepData) => updateStepData(stepData)}
          />
        );
      
      case 3:
        return (
          <DeliveryPickupScheduleStep
            data={{
              jobType: data.jobType,
              timezone: data.timezone,
              deliveryDate: data.deliveryDate || null,
              deliveryTime: data.deliveryTime || '09:00',
              addDeliveryTime: data.hasDeliveryTime || false,
              returnScheduleEnabled: data.returnScheduleEnabled || false,
              fullPickupDate: data.fullPickupDate || null,
              fullPickupTime: data.fullPickupTime || '14:00',
              addFullPickupTime: Boolean(data.fullPickupTime),
              partialPickupsEnabled: data.partialPickupEnabled || false,
              partialPickups: data.partialPickups || [],
              serviceDate: data.serviceDate || null,
              serviceTime: data.serviceTime || '09:00',
              addServiceTime: Boolean(data.serviceTime)
            }}
            onUpdate={(stepData) => {
              updateStepData({
                deliveryDate: stepData.deliveryDate,
                deliveryTime: stepData.deliveryTime,
                hasDeliveryTime: stepData.addDeliveryTime,
                returnScheduleEnabled: stepData.returnScheduleEnabled,
                fullPickupDate: stepData.fullPickupDate,
                fullPickupTime: stepData.fullPickupTime,
                partialPickupEnabled: stepData.partialPickupsEnabled,
                partialPickups: stepData.partialPickups,
                serviceDate: stepData.serviceDate,
                serviceTime: stepData.serviceTime
              });
            }}
          />
        );
      
      case 4:
        return (
          <LocationContactsStep
            data={{
              customerId: data.selectedCustomer?.id || null,
              selectedLocationId: data.selectedLocation?.id || null,
              selectedContactIds: data.selectedContacts?.map(c => c.id) || [],
              newLocationData: data.customLocation || null,
              specialInstructions: data.specialInstructions || ''
            }}
            onUpdate={(stepData) => {
              updateStepData({
                selectedLocation: stepData.selectedLocationId ? { id: stepData.selectedLocationId } : null,
                selectedContacts: stepData.selectedContactIds.map(id => ({ id })),
                customLocation: stepData.newLocationData,
                specialInstructions: stepData.specialInstructions
              });
            }}
          />
        );
      
      case 5:
        return (
          <InventoryConsumablesStep
            data={{
              bulkItems: data.bulkItems,
              selectSpecificUnits: data.selectSpecificUnits,
              selectedUnits: data.selectedUnits,
              addConsumables: data.addConsumables,
              consumablesBillingMethod: data.consumablesBillingMethod,
              selectedConsumables: data.selectedConsumables,
              selectedBundle: data.selectedBundle,
              subscriptionEnabled: data.subscriptionEnabled,
              inventorySubtotal: data.inventorySubtotal,
              consumablesSubtotal: data.consumablesSubtotal
            }}
            onUpdate={(stepData) => updateStepData(stepData)}
          />
        );
      
      case 6:
        return (
          <ServicesFrequencyStep
            data={{
              selectedServices: data.selectedServices,
              servicesSubtotal: data.servicesSubtotal
            }}
            onUpdate={(stepData) => updateStepData(stepData)}
          />
        );
      
      case 7:
        return (
          <ServiceTemplateAssignmentStep
            data={{
              selectedTemplateIds: data.selectedTemplateIds,
              defaultTemplateId: data.defaultTemplateId,
              availableTemplates: [],
              preSelectedFromServices: []
            }}
            onUpdate={(stepData) => updateStepData({
              selectedTemplateIds: stepData.selectedTemplateIds,
              defaultTemplateId: stepData.defaultTemplateId
            })}
            selectedServices={data.selectedServices}
          />
        );
      
      case 8:
        return (
          <CrewAssignmentStep
            data={{
              selectedDriver: data.selectedDriver,
              selectedVehicle: data.selectedVehicle,
              hasConflicts: data.hasConflicts
            }}
            onUpdate={(stepData) => updateStepData(stepData)}
            jobDates={getJobDates()}
          />
        );
      
      case 9:
        return (
          <SpecialInstructionsReviewStep
            data={{
              specialInstructions: data.specialInstructions,
              additionalContacts: data.additionalContacts,
              quickAddContact: data.quickAddContact
            }}
            onUpdate={(stepData) => updateStepData(stepData)}
            jobTypeData={{ jobType: data.jobType, timezone: data.timezone }}
            scheduleData={{
              deliveryDate: data.deliveryDate,
              deliveryTime: data.deliveryTime,
              pickupDates: data.partialPickups.map(p => p.date).concat(data.fullPickupDate ? [data.fullPickupDate] : []),
              serviceDate: data.serviceDate
            }}
            locationData={{ selectedLocation: data.selectedLocation }}
            inventoryData={{
              bulkItems: data.bulkItems,
              selectedUnits: data.selectedUnits,
              selectedConsumables: data.selectedConsumables,
              inventorySubtotal: data.inventorySubtotal,
              consumablesSubtotal: data.consumablesSubtotal
            }}
            servicesData={{
              selectedServices: data.selectedServices,
              servicesSubtotal: data.servicesSubtotal
            }}
            crewData={{
              selectedDriver: data.selectedDriver,
              selectedVehicle: data.selectedVehicle
            }}
            customerContacts={customerContacts}
          />
        );
      
      default:
        return <div>Step not found</div>;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="bg-background h-full w-1/2 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-foreground">Add New Job</h1>
            <Button variant="ghost" onClick={onCancel}>
              ✕
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Step {currentStep} of {STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Steps Navigation */}
          <div className="flex items-center space-x-2 mt-4 overflow-x-auto">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap",
                  step.id === currentStep && "bg-primary text-primary-foreground",
                  step.id < currentStep && "bg-green-100 text-green-800",
                  step.id > currentStep && "bg-muted text-muted-foreground"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 text-center text-xs">{step.id}</span>
                )}
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {STEPS[currentStep - 1]?.description}
          </div>
          
          {currentStep === STEPS.length ? (
            <Button
              onClick={handleComplete}
              disabled={!canProceedToNext()}
              className="flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Create Job</span>
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};