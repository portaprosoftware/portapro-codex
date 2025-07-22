
import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, User, Briefcase, Calendar, MapPin, Truck, Package, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerStep } from './steps/CustomerStep';
import { JobTypeStep } from './steps/JobTypeStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { LocationStep } from './steps/LocationStep';
import { DriverVehicleStep } from './steps/DriverVehicleStep';
import { EquipmentServicesStep } from './steps/EquipmentServicesStep';
import { ReviewStep } from './steps/ReviewStep';

interface AddNewJobSliderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface JobFormData {
  customer: {
    id: string;
    name: string;
    address: string;
  } | null;
  jobType: 'delivery' | 'pickup' | 'service' | null;
  dateTime: {
    date: Date | null;
    time: string;
    timezone: string;
  };
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    } | null;
    specialInstructions: string;
  };
  assignment: {
    driverId: string | null;
    vehicleId: string | null;
  };
  equipment: {
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      type: 'equipment' | 'service';
    }>;
  };
}

const steps = [
  { id: 1, name: 'Customer', icon: User },
  { id: 2, name: 'Job Type', icon: Briefcase },
  { id: 3, name: 'Date & Time', icon: Calendar },
  { id: 4, name: 'Location', icon: MapPin },
  { id: 5, name: 'Driver & Vehicle', icon: Truck },
  { id: 6, name: 'Equipment & Services', icon: Package },
  { id: 7, name: 'Review', icon: CheckCircle },
];

export const AddNewJobSlider: React.FC<AddNewJobSliderProps> = ({ open, onOpenChange }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<JobFormData>({
    customer: null,
    jobType: null,
    dateTime: {
      date: null,
      time: '09:00',
      timezone: 'America/New_York',
    },
    location: {
      address: '',
      coordinates: null,
      specialInstructions: '',
    },
    assignment: {
      driverId: null,
      vehicleId: null,
    },
    equipment: {
      items: [],
    },
  });

  const sliderTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sliderTrackRef.current) {
      sliderTrackRef.current.style.transform = `translateX(-${(currentStep - 1) * 100}%)`;
    }
  }, [currentStep]);

  // Reset form when slider closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setFormData({
        customer: null,
        jobType: null,
        dateTime: {
          date: null,
          time: '09:00',
          timezone: 'America/New_York',
        },
        location: {
          address: '',
          coordinates: null,
          specialInstructions: '',
        },
        assignment: {
          driverId: null,
          vehicleId: null,
        },
        equipment: {
          items: [],
        },
      });
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // TODO: Implement job creation logic
      console.log('Submitting job:', formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const updateFormData = (stepData: Partial<JobFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.customer !== null;
      case 2: return formData.jobType !== null;
      case 3: return formData.dateTime.date !== null;
      case 4: return formData.location.address.length > 0;
      case 5: return formData.assignment.driverId !== null;
      case 6: return formData.equipment.items.length > 0;
      case 7: return true;
      default: return false;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[70vw] max-w-none p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-gray-200">
          <SheetTitle className="text-xl font-semibold text-gray-900">
            Add New Job
          </SheetTitle>
          
          {/* Stepper Bar */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                      isActive 
                        ? "bg-gradient-to-r from-[#3366FF] to-[#6699FF] text-white border-transparent"
                        : isCompleted
                        ? "bg-green-500 text-white border-transparent"
                        : "bg-white text-gray-400 border-gray-300"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={cn(
                      "text-xs mt-1 font-medium transition-colors duration-200",
                      isActive 
                        ? "text-[#3366FF]"
                        : isCompleted
                        ? "text-green-500"
                        : "text-gray-400"
                    )}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-4 transition-colors duration-200",
                      currentStep > step.id 
                        ? "bg-green-500"
                        : "bg-gray-300"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </SheetHeader>

        {/* Slider Container */}
        <div className="flex-1 overflow-hidden">
          <div className="slider-viewport h-full relative">
            <div 
              ref={sliderTrackRef}
              className="slider-track flex h-full transition-transform duration-300 ease-in-out"
            >
              {/* Step 1: Customer */}
              <div className="slider-panel flex-none w-full p-6">
                <CustomerStep 
                  data={formData.customer}
                  onUpdate={(customer) => updateFormData({ customer })}
                />
              </div>

              {/* Step 2: Job Type */}
              <div className="slider-panel flex-none w-full p-6">
                <JobTypeStep 
                  data={formData.jobType}
                  onUpdate={(jobType) => updateFormData({ jobType })}
                />
              </div>

              {/* Step 3: Date & Time */}
              <div className="slider-panel flex-none w-full p-6">
                <DateTimeStep 
                  data={formData.dateTime}
                  onUpdate={(dateTime) => updateFormData({ dateTime })}
                />
              </div>

              {/* Step 4: Location */}
              <div className="slider-panel flex-none w-full p-6">
                <LocationStep 
                  data={formData.location}
                  onUpdate={(location) => updateFormData({ location })}
                />
              </div>

              {/* Step 5: Driver & Vehicle */}
              <div className="slider-panel flex-none w-full p-6">
                <DriverVehicleStep 
                  data={formData.assignment}
                  onUpdate={(assignment) => updateFormData({ assignment })}
                />
              </div>

              {/* Step 6: Equipment & Services */}
              <div className="slider-panel flex-none w-full p-6">
                <EquipmentServicesStep 
                  data={formData.equipment}
                  onUpdate={(equipment) => updateFormData({ equipment })}
                />
              </div>

              {/* Step 7: Review */}
              <div className="slider-panel flex-none w-full p-6">
                <ReviewStep 
                  data={formData}
                  onEdit={(step) => setCurrentStep(step)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Navigation */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep === 7 ? (
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Submit Job
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-[#3366FF] to-[#6699FF] hover:from-[#2952CC] hover:to-[#5580E6] text-white flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
