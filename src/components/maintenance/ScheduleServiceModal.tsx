import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Save, X, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ScheduleServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Service {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  estimated_duration_minutes: number;
  eligible_targets: any;
}

interface Customer {
  id: string;
  name: string;
}

export const ScheduleServiceModal: React.FC<ScheduleServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [assignedTech, setAssignedTech] = useState("");
  const [frequency, setFrequency] = useState("once");

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data?.map(service => ({
        ...service,
        estimated_duration: service.estimated_duration_minutes,
        eligible_targets: Array.isArray(service.eligible_targets) 
          ? service.eligible_targets 
          : (service.eligible_targets as any)?.units || []
      })) as Service[];
    }
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data as Customer[];
    }
  });

  const { data: productItems } = useQuery({
    queryKey: ['product-items', selectedCustomer],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      
      // This would typically filter by customer assignments
      const { data, error } = await supabase
        .from('product_items')
        .select('*')
        .eq('status', 'available')
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCustomer && selectedService?.eligible_targets?.includes('units')
  });

  const scheduleServiceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService || !selectedCustomer) {
        throw new Error('Service and customer are required');
      }

      const jobData = {
        customer_id: selectedCustomer,
        job_type: 'service',
        status: 'scheduled',
        scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
        scheduled_time: scheduledTime,
        driver_id: assignedTech || null,
        notes: `Scheduled ${selectedService.name} service`,
        estimated_duration: selectedService.estimated_duration_minutes,
        service_id: selectedService.id,
      };

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single();

      if (jobError) throw jobError;

      // If units were selected, create equipment assignments
      if (selectedUnits.length > 0) {
        const assignments = selectedUnits.map(unitId => ({
          job_id: job.id,
          product_item_id: unitId,
          quantity: 1,
          assigned_date: format(scheduledDate, 'yyyy-MM-dd'),
          status: 'assigned'
        }));

        const { error: assignmentError } = await supabase
          .from('equipment_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Service scheduled successfully');
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to schedule service');
      console.error(error);
    }
  });

  const resetForm = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedCustomer("");
    setSelectedUnits([]);
    setScheduledDate(new Date());
    setScheduledTime("09:00");
    setAssignedTech("");
    setFrequency("once");
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    scheduleServiceMutation.mutate();
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'cleaning':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'maintenance':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      case 'emergency':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'inspection':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">Choose Service</Label>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {services?.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedService?.id === service.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{service.name}</h4>
                        <Badge className={`text-xs ${getCategoryColor(service.category)}`}>
                          {service.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <p className="text-xs text-gray-500">Est. {service.estimated_duration_minutes} minutes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">Choose Customer & Targets</Label>
            
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedService?.eligible_targets?.includes('units') && selectedCustomer && (
              <div>
                <Label>Select Units</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded p-3">
                  {productItems?.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={selectedUnits.includes(item.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUnits([...selectedUnits, item.id]);
                          } else {
                            setSelectedUnits(selectedUnits.filter(id => id !== item.id));
                          }
                        }}
                      />
                      <Label htmlFor={item.id} className="text-sm">
                        {item.item_code} - {item.status}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedUnits.length} unit(s) selected
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">Assign & Schedule</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(scheduledDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={(date) => date && setScheduledDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tech">Assigned Technician (Optional)</Label>
              <Input
                id="tech"
                placeholder="Enter technician name"
                value={assignedTech}
                onChange={(e) => setAssignedTech(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">One-time</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">Confirm Details</Label>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <span className="font-medium">Service: </span>
                <span>{selectedService?.name}</span>
                <Badge className={`ml-2 text-xs ${getCategoryColor(selectedService?.category || '')}`}>
                  {selectedService?.category}
                </Badge>
              </div>
              
              <div>
                <span className="font-medium">Customer: </span>
                <span>{customers?.find(c => c.id === selectedCustomer)?.name}</span>
              </div>
              
              {selectedUnits.length > 0 && (
                <div>
                  <span className="font-medium">Units: </span>
                  <span>{selectedUnits.length} selected</span>
                </div>
              )}
              
              <div>
                <span className="font-medium">Scheduled: </span>
                <span>{format(scheduledDate, "PPP")} at {scheduledTime}</span>
              </div>
              
              {assignedTech && (
                <div>
                  <span className="font-medium">Technician: </span>
                  <span>{assignedTech}</span>
                </div>
              )}
              
              <div>
                <span className="font-medium">Frequency: </span>
                <span className="capitalize">{frequency}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Service - Step {step} of 4</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`flex items-center ${num < 4 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    num <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {num}
                </div>
                {num < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      num < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={step === 1 ? onClose : handleBack}
            >
              <X className="w-4 h-4 mr-2" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !selectedService) ||
                  (step === 2 && !selectedCustomer)
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={scheduleServiceMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {scheduleServiceMutation.isPending ? "Scheduling..." : "Schedule Service"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};