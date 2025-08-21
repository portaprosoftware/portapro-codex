import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ClipboardCheck, Clock, DollarSign, Wrench, CalendarIcon, Plus, X, User, Truck } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { DriverSelectionModal } from '@/components/fleet/DriverSelectionModal';
import { VehicleSelectionModal } from '@/components/fleet/VehicleSelectionModal';
import { useQuery } from '@tanstack/react-query';
import { calculateServiceVisits } from '@/lib/serviceCalculations';

interface ServiceDateDetail {
  date: Date;
  time?: string;
  notes?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  service_code?: string;
  pricing_method: 'per_visit' | 'per_hour' | 'flat_rate';
  per_visit_cost?: number;
  per_hour_cost?: number;
  flat_rate_cost?: number;
  estimated_duration_hours?: number;
  selected: boolean;
  frequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'custom';
  custom_frequency_days?: number;
  custom_type?: 'days_interval' | 'days_of_week' | 'specific_dates';
  custom_days_of_week?: string[]; // ['monday', 'wednesday', 'friday']
  custom_specific_dates?: ServiceDateDetail[]; // Array of date objects with time and notes
  calculated_cost: number;
  include_dropoff_service: boolean;
  include_pickup_service: boolean;
  visit_count: number;
  service_dates: string[];
  // Pricing override
  price_override?: {
    enabled: boolean;
    method: 'per_visit' | 'flat_for_job';
    amount: number;
  };
}

interface ServicesFrequencyData {
  selectedServices: ServiceItem[];
  servicesSubtotal: number;
  scheduledDriverForAll?: any;
  scheduledVehicleForAll?: any;
  useSameDriverForAll: boolean;
  useSameVehicleForAll: boolean;
  groupAssignmentsByDay: boolean;
  dayAssignments?: {
    [dateKey: string]: {
      driver?: any;
      vehicle?: any;
    }
  };
  individualServiceAssignments?: {
    [serviceId: string]: {
      [dateKey: string]: {
        driver?: any;
        vehicle?: any;
      }
    }
  };
  expandedDays?: Set<string>;
  // Package override
  package_override?: {
    enabled: boolean;
    amount: number;
  };
}

interface ServicesFrequencyStepProps {
  data: ServicesFrequencyData;
  onUpdate: (data: ServicesFrequencyData) => void;
}

export const ServicesFrequencyStep: React.FC<ServicesFrequencyStepProps> = ({ 
  data, 
  onUpdate 
}) => {
  const { state } = useJobWizard();
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedServiceDate, setSelectedServiceDate] = useState<Date>(new Date());
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDateKey, setSelectedDateKey] = useState<string>('');
  const [selectedDayForAssignment, setSelectedDayForAssignment] = useState<string>('');
  const [showRemoveOverrideDialog, setShowRemoveOverrideDialog] = useState(false);
  const [overrideToRemove, setOverrideToRemove] = useState<{
    type: 'driver' | 'vehicle';
    serviceId?: string;
    dateKey?: string;
    dayKey?: string;
  } | null>(null);

  // Fetch assigned driver details from step 4
  const { data: assignedDriver } = useQuery({
    queryKey: ['assigned-driver', state.data.driver_id],
    queryFn: async () => {
      if (!state.data.driver_id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', state.data.driver_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!state.data.driver_id,
  });

  // Fetch assigned vehicle details from step 4
  const { data: assignedVehicle } = useQuery({
    queryKey: ['assigned-vehicle', state.data.vehicle_id],
    queryFn: async () => {
      if (!state.data.vehicle_id) return null;
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model, year, nickname')
        .eq('id', state.data.vehicle_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!state.data.vehicle_id,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    calculateServicesSubtotal();
  }, [data.selectedServices]);

  const fetchServices = async () => {
    try {
      // Fetch from routine_maintenance_services table
      const { data: servicesData } = await supabase
        .from('routine_maintenance_services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      const services: ServiceItem[] = (servicesData || []).map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        service_code: service.service_code,
        pricing_method: service.pricing_method as 'per_visit' | 'per_hour' | 'flat_rate',
        per_visit_cost: service.per_visit_cost,
        per_hour_cost: service.per_hour_cost,
        flat_rate_cost: service.flat_rate_cost,
        estimated_duration_hours: service.estimated_duration_hours,
        selected: false,
        frequency: 'one-time' as const,
        custom_frequency_days: 1,
        custom_type: 'days_interval' as const,
        custom_days_of_week: [],
        custom_specific_dates: [],
        calculated_cost: 0,
        include_dropoff_service: false,
        include_pickup_service: false,
        visit_count: 0,
        service_dates: [],
        price_override: undefined
      }));

      setAvailableServices(services);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateServicesSubtotal = () => {
    const calculatedSubtotal = data.selectedServices.reduce((sum, service) => 
      sum + service.calculated_cost, 0
    );
    
    // Use package override if enabled, otherwise use calculated subtotal
    const finalSubtotal = data.package_override?.enabled 
      ? data.package_override.amount 
      : calculatedSubtotal;
    
    onUpdate({
      ...data,
      servicesSubtotal: finalSubtotal
    });
  };

  const calculateServiceCost = (service: ServiceItem): ServiceItem => {
    // Get rental dates from job wizard context
    const startDate = state.data.scheduled_date ? new Date(state.data.scheduled_date) : new Date();
    const endDate = state.data.return_date ? new Date(state.data.return_date) : new Date();
    
    let perVisitCost = 0;
    
    // Check for pricing override first
    if (service.price_override?.enabled) {
      if (service.price_override.method === 'per_visit') {
        perVisitCost = service.price_override.amount;
      } else if (service.price_override.method === 'flat_for_job') {
        // For flat jobs, we'll calculate visits first then override the total
        switch (service.pricing_method) {
          case 'per_visit':
            perVisitCost = service.per_visit_cost || 0;
            break;
          case 'per_hour':
            perVisitCost = (service.per_hour_cost || 0) * (service.estimated_duration_hours || 1);
            break;
          case 'flat_rate':
            perVisitCost = service.flat_rate_cost || 0;
            break;
        }
      }
    } else {
      // Use standard pricing
      switch (service.pricing_method) {
        case 'per_visit':
          perVisitCost = service.per_visit_cost || 0;
          break;
        case 'per_hour':
          perVisitCost = (service.per_hour_cost || 0) * (service.estimated_duration_hours || 1);
          break;
        case 'flat_rate':
          perVisitCost = service.flat_rate_cost || 0;
          break;
      }
    }

    // Calculate service visits based on frequency and rental duration
    const calculation = calculateServiceVisits({
      startDate,
      endDate,
      frequency: service.frequency,
      customFrequencyDays: service.custom_frequency_days,
      customDaysOfWeek: service.custom_days_of_week,
      customSpecificDates: service.custom_specific_dates,
      includeDropoffService: service.include_dropoff_service,
      includePickupService: service.include_pickup_service,
      perVisitCost,
      serviceTime: '09:00',
      timezone: 'America/New_York'
    });

    let finalCost = calculation.totalCost;
    
    // Apply flat override if set
    if (service.price_override?.enabled && service.price_override.method === 'flat_for_job') {
      finalCost = service.price_override.amount;
    }

    return {
      ...service,
      calculated_cost: finalCost,
      visit_count: calculation.visits.length,
      service_dates: calculation.visits.map(v => v.displayDate)
    };
  };

  const toggleService = (serviceId: string, selected: boolean) => {
    if (selected) {
      const service = availableServices.find(s => s.id === serviceId);
      if (service) {
        const serviceWithCost = calculateServiceCost({
          ...service,
          selected: true,
          frequency: 'one-time' as const, // Default frequency when first selected
        });
        
        onUpdate({
          ...data,
          selectedServices: [...data.selectedServices, serviceWithCost]
        });
      }
    } else {
      onUpdate({
        ...data,
        selectedServices: data.selectedServices.filter(s => s.id !== serviceId)
      });
    }
  };

  const updateServiceFrequency = (serviceId: string, frequency: string) => {
    const updatedServices = data.selectedServices.map(service => {
      if (service.id === serviceId) {
        let updatedService = {
          ...service,
          frequency: frequency as ServiceItem['frequency']
        };
        
        // Set default custom type when switching to custom
        if (frequency === 'custom' && !updatedService.custom_type) {
          updatedService.custom_type = 'days_interval';
          updatedService.custom_frequency_days = 1;
        }
        
        return calculateServiceCost(updatedService);
      }
      return service;
    });

    onUpdate({
      ...data,
      selectedServices: updatedServices
    });
  };

  const updateCustomFrequency = (serviceId: string, days: number) => {
    const updatedServices = data.selectedServices.map(service => {
      if (service.id === serviceId) {
        const updatedService = {
          ...service,
          custom_frequency_days: days
        };
        return calculateServiceCost(updatedService);
      }
      return service;
    });

    onUpdate({
      ...data,
      selectedServices: updatedServices
    });
  };

  const updateCustomType = (serviceId: string, customType: string) => {
    const updatedServices = data.selectedServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          custom_type: customType as 'days_interval' | 'days_of_week' | 'specific_dates',
          // Reset other custom values when changing type
          custom_frequency_days: customType === 'days_interval' ? (service.custom_frequency_days || 1) : undefined,
          custom_days_of_week: customType === 'days_of_week' ? [] : undefined,
          custom_specific_dates: customType === 'specific_dates' ? [] : undefined
        };
      }
      return service;
    });

    onUpdate({
      ...data,
      selectedServices: updatedServices
    });
  };

  const updateCustomDaysOfWeek = (serviceId: string, days: string[]) => {
    const updatedServices = data.selectedServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          custom_days_of_week: days
        };
      }
      return service;
    });

    onUpdate({
      ...data,
      selectedServices: updatedServices
    });
  };

  const updateCustomSpecificDates = (serviceId: string, dates: ServiceDateDetail[]) => {
    const updatedServices = data.selectedServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          custom_specific_dates: dates
        };
      }
      return service;
    });

    onUpdate({
      ...data,
      selectedServices: updatedServices
    });
  };

  const addSpecificDate = (serviceId: string, date: Date) => {
    const service = data.selectedServices.find(s => s.id === serviceId);
    if (service) {
      const newDateDetail: ServiceDateDetail = { date };
      const currentDates = service.custom_specific_dates || [];
      updateCustomSpecificDates(serviceId, [...currentDates, newDateDetail]);
    }
  };

  const removeSpecificDate = (serviceId: string, index: number) => {
    const service = data.selectedServices.find(s => s.id === serviceId);
    if (service && service.custom_specific_dates) {
      const updatedDates = service.custom_specific_dates.filter((_, i) => i !== index);
      updateCustomSpecificDates(serviceId, updatedDates);
    }
  };

  const updateDateDetail = (serviceId: string, index: number, field: 'time' | 'notes', value: string) => {
    const service = data.selectedServices.find(s => s.id === serviceId);
    if (service && service.custom_specific_dates && service.custom_specific_dates[index]) {
      const updatedDates = [...service.custom_specific_dates];
      updatedDates[index] = {
        ...updatedDates[index],
        [field]: value
      };
      updateCustomSpecificDates(serviceId, updatedDates);
    }
  };

  const handleDriverSelect = (driver: any) => {
    if (selectedDayForAssignment) {
      // Day-level assignment
      const currentDayAssignments = data.dayAssignments || {};
      onUpdate({
        ...data,
        dayAssignments: {
          ...currentDayAssignments,
          [selectedDayForAssignment]: {
            ...currentDayAssignments[selectedDayForAssignment],
            driver
          }
        }
      });
    } else if (selectedServiceId && selectedDateKey) {
      // Individual service date assignment
      const currentAssignments = data.individualServiceAssignments || {};
      const serviceAssignments = currentAssignments[selectedServiceId] || {};
      const dateAssignment = serviceAssignments[selectedDateKey] || {};
      
      onUpdate({
        ...data,
        individualServiceAssignments: {
          ...currentAssignments,
          [selectedServiceId]: {
            ...serviceAssignments,
            [selectedDateKey]: {
              ...dateAssignment,
              driver
            }
          }
        }
      });
    } else {
      // Global assignment
      onUpdate({
        ...data,
        scheduledDriverForAll: driver
      });
    }
  };

  const handleVehicleSelect = (vehicle: any) => {
    if (selectedDayForAssignment) {
      // Day-level assignment
      const currentDayAssignments = data.dayAssignments || {};
      onUpdate({
        ...data,
        dayAssignments: {
          ...currentDayAssignments,
          [selectedDayForAssignment]: {
            ...currentDayAssignments[selectedDayForAssignment],
            vehicle
          }
        }
      });
    } else if (selectedServiceId && selectedDateKey) {
      // Individual service date assignment
      const currentAssignments = data.individualServiceAssignments || {};
      const serviceAssignments = currentAssignments[selectedServiceId] || {};
      const dateAssignment = serviceAssignments[selectedDateKey] || {};
      
      onUpdate({
        ...data,
        individualServiceAssignments: {
          ...currentAssignments,
          [selectedServiceId]: {
            ...serviceAssignments,
            [selectedDateKey]: {
              ...dateAssignment,
              vehicle
            }
          }
        }
      });
    } else {
      // Global assignment
      onUpdate({
        ...data,
        scheduledVehicleForAll: vehicle
      });
    }
  };

  const openDriverModalForDate = (serviceId: string, date: Date, dateKey: string) => {
    setSelectedServiceId(serviceId);
    // Parse the date properly to avoid timezone offset
    const properDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedServiceDate(properDate);
    setSelectedDateKey(dateKey);
    setShowDriverModal(true);
  };

  const openVehicleModalForDate = (serviceId: string, date: Date, dateKey: string) => {
    setSelectedServiceId(serviceId);
    // Parse the date properly to avoid timezone offset
    const properDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedServiceDate(properDate);
    setSelectedDateKey(dateKey);
    setShowVehicleModal(true);
  };

  const openDriverModalForDay = (dateKey: string, date: Date) => {
    setSelectedDayForAssignment(dateKey);
    setSelectedServiceId('');
    setSelectedDateKey('');
    setSelectedServiceDate(date);
    setShowDriverModal(true);
  };

  const openVehicleModalForDay = (dateKey: string, date: Date) => {
    setSelectedDayForAssignment(dateKey);
    setSelectedServiceId('');
    setSelectedDateKey('');
    setSelectedServiceDate(date);
    setShowVehicleModal(true);
  };

  const toggleDayExpansion = (dateKey: string) => {
    const currentExpanded = data.expandedDays || new Set();
    const newExpanded = new Set(currentExpanded);
    
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    
    onUpdate({
      ...data,
      expandedDays: newExpanded
    });
  };

  const openGlobalDriverModal = () => {
    setSelectedServiceId('');
    setSelectedDateKey('');
    setSelectedDayForAssignment('');
    // Use job scheduled date and parse as local date to avoid timezone offset
    const jobDate = state.data.scheduled_date 
      ? (() => {
          const [year, month, day] = state.data.scheduled_date.split('-').map(Number);
          return new Date(year, month - 1, day);
        })()
      : new Date();
    setSelectedServiceDate(jobDate);
    setShowDriverModal(true);
  };

  const openGlobalVehicleModal = () => {
    setSelectedServiceId('');
    setSelectedDateKey('');
    setSelectedDayForAssignment('');
    // Use job scheduled date and parse as local date to avoid timezone offset
    const jobDate = state.data.scheduled_date 
      ? (() => {
          const [year, month, day] = state.data.scheduled_date.split('-').map(Number);
          return new Date(year, month - 1, day);
        })()
      : new Date();
    setShowVehicleModal(true);
  };

  const toggleUseSameDriver = (checked: boolean) => {
    onUpdate({
      ...data,
      useSameDriverForAll: checked,
      scheduledDriverForAll: checked ? data.scheduledDriverForAll : undefined
    });
  };

  const toggleUseSameVehicle = (checked: boolean) => {
    onUpdate({
      ...data,
      useSameVehicleForAll: checked,
      scheduledVehicleForAll: checked ? data.scheduledVehicleForAll : undefined
    });
  };

  const getIndividualAssignment = (serviceId: string, dateKey: string) => {
    return data.individualServiceAssignments?.[serviceId]?.[dateKey];
  };

  const getPricingDisplay = (service: ServiceItem) => {
    if (service.price_override?.enabled) {
      if (service.price_override.method === 'per_visit') {
        return `$${service.price_override.amount.toFixed(2)}/visit (Custom)`;
      } else {
        return `$${service.price_override.amount.toFixed(2)} flat (Custom)`;
      }
    }
    
    switch (service.pricing_method) {
      case 'per_visit':
        return `$${service.per_visit_cost?.toFixed(2)}/visit`;
      case 'per_hour':
        return `$${service.per_hour_cost?.toFixed(2)}/hour`;
      case 'flat_rate':
        return `$${service.flat_rate_cost?.toFixed(2)} flat rate`;
      default:
        return 'Contact for pricing';
    }
  };

  const updateServicePriceOverride = (serviceId: string, enabled: boolean, method?: 'per_visit' | 'flat_for_job', amount?: number) => {
    const updatedServices = data.selectedServices.map(service => {
      if (service.id === serviceId) {
        const updatedService = {
          ...service,
          price_override: enabled ? {
            enabled: true,
            method: method || 'per_visit',
            amount: amount || 0
          } : undefined
        };
        return calculateServiceCost(updatedService);
      }
      return service;
    });

    onUpdate({
      ...data,
      selectedServices: updatedServices
    });
  };

  const updatePackageOverride = (enabled: boolean, amount?: number) => {
    const updatedData = {
      ...data,
      package_override: enabled ? {
        enabled: true,
        amount: amount || 0
      } : undefined
    };
    
    // Recalculate subtotal immediately
    const calculatedSubtotal = data.selectedServices.reduce((sum, service) => 
      sum + service.calculated_cost, 0
    );
    
    const finalSubtotal = enabled && amount !== undefined
      ? amount 
      : calculatedSubtotal;
    
    onUpdate({
      ...updatedData,
      servicesSubtotal: finalSubtotal
    });
  };

  const hasOverridesForDay = (dateKey: string) => {
    // Check if there are any individual service overrides for this day
    const servicesOnDay = data.selectedServices.filter(service => {
      const assignments = data.individualServiceAssignments?.[service.id]?.[dateKey];
      return assignments?.driver || assignments?.vehicle;
    });
    return servicesOnDay.length > 0;
  };

  const confirmRemoveOverride = (type: 'driver' | 'vehicle', serviceId?: string, dateKey?: string, dayKey?: string) => {
    setOverrideToRemove({ type, serviceId, dateKey, dayKey });
    setShowRemoveOverrideDialog(true);
  };

  const removeOverride = () => {
    if (!overrideToRemove) return;

    const { type, serviceId, dateKey, dayKey } = overrideToRemove;

    if (dayKey) {
      // Remove day-level override
      const currentDayAssignments = data.dayAssignments || {};
      const dayAssignment = currentDayAssignments[dayKey] || {};
      
      const updatedDayAssignment = { ...dayAssignment };
      if (type === 'driver') {
        delete updatedDayAssignment.driver;
      } else {
        delete updatedDayAssignment.vehicle;
      }
      
      // If no assignments left, remove the entire day entry
      const hasAssignments = updatedDayAssignment.driver || updatedDayAssignment.vehicle;
      const newDayAssignments = { ...currentDayAssignments };
      
      if (hasAssignments) {
        newDayAssignments[dayKey] = updatedDayAssignment;
      } else {
        delete newDayAssignments[dayKey];
      }
      
      onUpdate({
        ...data,
        dayAssignments: newDayAssignments
      });
    } else if (serviceId && dateKey) {
      // Remove individual service override
      const currentAssignments = data.individualServiceAssignments || {};
      const serviceAssignments = currentAssignments[serviceId] || {};
      const dateAssignment = serviceAssignments[dateKey] || {};
      
      const updatedDateAssignment = { ...dateAssignment };
      if (type === 'driver') {
        delete updatedDateAssignment.driver;
      } else {
        delete updatedDateAssignment.vehicle;
      }
      
      // If no assignments left, remove the entire date entry
      const hasAssignments = updatedDateAssignment.driver || updatedDateAssignment.vehicle;
      const newServiceAssignments = { ...serviceAssignments };
      
      if (hasAssignments) {
        newServiceAssignments[dateKey] = updatedDateAssignment;
      } else {
        delete newServiceAssignments[dateKey];
      }
      
      // If no dates left for this service, remove the entire service entry
      const hasServiceAssignments = Object.keys(newServiceAssignments).length > 0;
      const newIndividualAssignments = { ...currentAssignments };
      
      if (hasServiceAssignments) {
        newIndividualAssignments[serviceId] = newServiceAssignments;
      } else {
        delete newIndividualAssignments[serviceId];
      }
      
      onUpdate({
        ...data,
        individualServiceAssignments: newIndividualAssignments
      });
    }

    setShowRemoveOverrideDialog(false);
    setOverrideToRemove(null);
  };


  const getFrequencyLabel = (frequency: string, customType?: string, customDays?: number, daysOfWeek?: string[], specificDates?: ServiceDateDetail[]) => {
    switch (frequency) {
      case 'one-time': return 'One-Time';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';  
      case 'monthly': return 'Monthly';
      case 'custom':
        if (customType === 'days_interval') {
          return `Every ${customDays || 1} days`;
        } else if (customType === 'days_of_week') {
          return daysOfWeek?.length ? `${daysOfWeek.join(', ')}` : 'Select days';
        } else if (customType === 'specific_dates') {
          return specificDates?.length ? `${specificDates.length} dates selected` : 'Select dates';
        }
        return 'Custom';
      default: return 'One-Time';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <ClipboardCheck className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Services & Frequency</h2>
          <p className="text-muted-foreground">Select additional services and set their frequency</p>
        </div>
      </div>

      {/* Available Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="w-5 h-5" />
            <span>Available Services</span>
          </CardTitle>
          <CardDescription>
            Select services to include with this job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {availableServices.map((service) => {
              const isSelected = data.selectedServices.some(s => s.id === service.id);
              const selectedService = data.selectedServices.find(s => s.id === service.id);
              
              return (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        toggleService(service.id, checked as boolean)
                      }
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            {service.service_code && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0">
                                {service.service_code}
                              </Badge>
                            )}
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0">
                              {getPricingDisplay(service)}
                            </Badge>
                            {selectedService?.price_override?.enabled && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0">
                                Custom Price
                              </Badge>
                            )}
                            {service.estimated_duration_hours && (
                              <Badge variant="outline" className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{service.estimated_duration_hours}h</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                       {/* Custom Pricing Override - Only show when service is selected */}
                       {isSelected && selectedService && (
                         <div className="border-t pt-3 mt-3">
                           <div className="space-y-3">
                             <div className="flex items-center space-x-2">
                               <Checkbox
                                 id={`custom-price-${service.id}`}
                                 checked={selectedService.price_override?.enabled || false}
                                 onCheckedChange={(checked) => {
                                   if (checked) {
                                     updateServicePriceOverride(service.id, true, 'per_visit', selectedService.per_visit_cost || 0);
                                   } else {
                                     updateServicePriceOverride(service.id, false);
                                   }
                                 }}
                               />
                               <Label htmlFor={`custom-price-${service.id}`} className="text-sm font-medium">
                                 Custom pricing for this service
                               </Label>
                             </div>
                             
                             {selectedService.price_override?.enabled && (
                               <div className="ml-6 space-y-3 p-3 bg-muted/30 rounded-lg">
                                 <div className="flex items-center space-x-3">
                                   <Label className="text-sm">Pricing method:</Label>
                                   <div className="flex space-x-2">
                                     <Button
                                       variant={selectedService.price_override.method === 'per_visit' ? 'default' : 'outline'}
                                       size="sm"
                                       onClick={() => updateServicePriceOverride(
                                         service.id, 
                                         true, 
                                         'per_visit', 
                                         selectedService.price_override?.amount || selectedService.per_visit_cost || 0
                                       )}
                                     >
                                       Per Visit
                                     </Button>
                                     <Button
                                       variant={selectedService.price_override.method === 'flat_for_job' ? 'default' : 'outline'}
                                       size="sm"
                                       onClick={() => updateServicePriceOverride(
                                         service.id, 
                                         true, 
                                         'flat_for_job', 
                                         selectedService.price_override?.amount || (selectedService.per_visit_cost || 0) * (selectedService.visit_count || 1)
                                       )}
                                     >
                                       Flat for Job
                                     </Button>
                                   </div>
                                 </div>
                                 <div>
                                   <Label className="text-sm font-medium">
                                     {selectedService.price_override.method === 'per_visit' ? 'Price per visit' : 'Total flat price'}
                                   </Label>
                                   <div className="flex items-center space-x-2 mt-1">
                                     <span className="text-sm">$</span>
                                     <Input
                                       type="number"
                                       min="0"
                                       step="0.01"
                                       value={selectedService.price_override.amount}
                                       onChange={(e) => updateServicePriceOverride(
                                         service.id,
                                         true,
                                         selectedService.price_override?.method || 'per_visit',
                                         parseFloat(e.target.value) || 0
                                       )}
                                       className="flex-1"
                                     />
                                   </div>
                                   <p className="text-xs text-muted-foreground mt-1">
                                     {selectedService.price_override.method === 'per_visit' 
                                       ? 'Enter the custom rate per service visit'
                                       : 'Enter a flat price for this service regardless of visit count'
                                     }
                                   </p>
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       )}

                       {/* Frequency Selection - Only show when service is selected */}
                       {isSelected && selectedService && (
                         <div className="border-t pt-3 mt-3">
                           <div className="space-y-3">
                             <div>
                               <Label htmlFor={`frequency-${service.id}`} className="text-sm font-medium">
                                 Service Frequency <span className="text-destructive">*</span>
                               </Label>
                               <Select
                                 value={selectedService.frequency}
                                 onValueChange={(value) => updateServiceFrequency(service.id, value)}
                               >
                                 <SelectTrigger id={`frequency-${service.id}`} className="mt-1">
                                   <SelectValue placeholder="Select frequency" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="one-time">One-Time</SelectItem>
                                   <SelectItem value="daily">Daily</SelectItem>
                                   <SelectItem value="weekly">Weekly (based on first day of schedule)</SelectItem>
                                   <SelectItem value="custom">Custom</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>
                             
                             {selectedService.frequency === 'custom' && (
                               <div className="space-y-3">
                                 <div>
                                   <Label className="text-sm font-medium">Custom Type</Label>
                                   <div className="flex flex-wrap gap-2 mt-1">
                                     <Button
                                       variant={selectedService.custom_type === 'days_interval' ? 'default' : 'outline'}
                                       size="sm"
                                       onClick={() => updateCustomType(service.id, 'days_interval')}
                                     >
                                       Every X Days
                                     </Button>
                                     <Button
                                       variant={selectedService.custom_type === 'days_of_week' ? 'default' : 'outline'}
                                       size="sm"
                                       onClick={() => updateCustomType(service.id, 'days_of_week')}
                                     >
                                       Specific Days of Week
                                     </Button>
                                     <Button
                                       variant={selectedService.custom_type === 'specific_dates' ? 'default' : 'outline'}
                                       size="sm"
                                       onClick={() => updateCustomType(service.id, 'specific_dates')}
                                     >
                                       Specific Dates
                                     </Button>
                                   </div>
                                 </div>

                                 {selectedService.custom_type === 'days_interval' && (
                                   <div>
                                     <Label className="text-sm font-medium">Every X Days</Label>
                                     <Input
                                       type="number"
                                       min="1"
                                       value={selectedService.custom_frequency_days || 1}
                                       onChange={(e) => updateCustomFrequency(
                                         service.id, 
                                         parseInt(e.target.value) || 1
                                       )}
                                       className="mt-1"
                                     />
                                   </div>
                                 )}

                                 {selectedService.custom_type === 'days_of_week' && (
                                   <div>
                                     <Label className="text-sm font-medium">Select Days of Week</Label>
                                     <div className="grid grid-cols-2 gap-2 mt-1">
                                       {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                         <label key={day} className="flex items-center space-x-2 text-sm">
                                           <input
                                             type="checkbox"
                                             checked={selectedService.custom_days_of_week?.includes(day) || false}
                                             onChange={(e) => {
                                               const currentDays = selectedService.custom_days_of_week || [];
                                               const newDays = e.target.checked
                                                 ? [...currentDays, day]
                                                 : currentDays.filter(d => d !== day);
                                               updateCustomDaysOfWeek(service.id, newDays);
                                             }}
                                             className="rounded"
                                           />
                                           <span>{day}</span>
                                         </label>
                                       ))}
                                     </div>
                                   </div>
                                 )}

                                 {selectedService.custom_type === 'specific_dates' && (
                                   <div>
                                     <Label className="text-sm font-medium">Select Specific Dates</Label>
                                     <div className="mt-1 space-y-3">
                                       <Popover>
                                         <PopoverTrigger asChild>
                                           <Button
                                             variant="outline"
                                             className={cn(
                                               "w-full justify-start text-left font-normal",
                                               "text-muted-foreground"
                                             )}
                                           >
                                             <CalendarIcon className="mr-2 h-4 w-4" />
                                             <Plus className="mr-2 h-4 w-4" />
                                             Add Date
                                           </Button>
                                         </PopoverTrigger>
                                         <PopoverContent className="w-auto p-0" align="start">
                                           <Calendar
                                             mode="single"
                                             onSelect={(date) => {
                                               if (date) {
                                                 addSpecificDate(service.id, date);
                                               }
                                             }}
                                             className="p-3 pointer-events-auto"
                                           />
                                         </PopoverContent>
                                       </Popover>
                                       
                                       {selectedService.custom_specific_dates && selectedService.custom_specific_dates.length > 0 && (
                                         <div className="space-y-2">
                                           {selectedService.custom_specific_dates.map((dateDetail, index) => (
                                             <div key={index} className="p-3 border rounded-lg bg-muted/30">
                                               <div className="flex items-center justify-between mb-2">
                                                 <span className="font-medium">
                                                   {format(dateDetail.date, 'PPP')}
                                                 </span>
                                                 <Button
                                                   variant="ghost"
                                                   size="sm"
                                                   onClick={() => removeSpecificDate(service.id, index)}
                                                   className="h-6 w-6 p-0"
                                                 >
                                                   <X className="h-3 w-3" />
                                                 </Button>
                                               </div>
                                               <div className="grid grid-cols-2 gap-2">
                                                 <div>
                                                   <Label className="text-xs">Time (optional)</Label>
                                                   <Input
                                                     type="time"
                                                     value={dateDetail.time || ''}
                                                     onChange={(e) => updateDateDetail(service.id, index, 'time', e.target.value)}
                                                     className="mt-1 h-8"
                                                   />
                                                 </div>
                                                 <div>
                                                   <Label className="text-xs">Notes (optional)</Label>
                                                   <Input
                                                     placeholder="Service notes..."
                                                     value={dateDetail.notes || ''}
                                                     onChange={(e) => updateDateDetail(service.id, index, 'notes', e.target.value)}
                                                     className="mt-1 h-8"
                                                   />
                                                 </div>
                                               </div>
                                             </div>
                                           ))}
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 )}
                               </div>
                             )}
                             
                              {/* Drop-off and Pickup Day Toggles */}
                              <div className="space-y-3 pt-3 border-t">
                                <Label className="text-sm font-medium">Additional Services</Label>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Services are billed per visit. Frequency sets how many visits occur while the unit is on site. Use the options below to add a service on delivery or pickup day if needed.
                                </p>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`dropoff-${service.id}`}
                                    checked={selectedService.include_dropoff_service}
                                    onCheckedChange={(checked) => {
                                      const updatedServices = data.selectedServices.map(s => {
                                        if (s.id === service.id) {
                                          const updated = { ...s, include_dropoff_service: checked as boolean };
                                          return calculateServiceCost(updated);
                                        }
                                        return s;
                                      });
                                      onUpdate({ ...data, selectedServices: updatedServices });
                                    }}
                                  />
                                  <Label htmlFor={`dropoff-${service.id}`} className="text-sm">
                                    Include a service on the delivery day (charge applies)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`pickup-${service.id}`}
                                    checked={selectedService.include_pickup_service}
                                    onCheckedChange={(checked) => {
                                      const updatedServices = data.selectedServices.map(s => {
                                        if (s.id === service.id) {
                                          const updated = { ...s, include_pickup_service: checked as boolean };
                                          return calculateServiceCost(updated);
                                        }
                                        return s;
                                      });
                                      onUpdate({ ...data, selectedServices: updatedServices });
                                    }}
                                  />
                                  <Label htmlFor={`pickup-${service.id}`} className="text-sm">
                                    Include a service on the pickup day (charge applies)
                                  </Label>
                                </div>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Selected frequency: <span className="font-medium">
                                  {getFrequencyLabel(
                                    selectedService.frequency,
                                    selectedService.custom_type,
                                    selectedService.custom_frequency_days,
                                    selectedService.custom_days_of_week,
                                    selectedService.custom_specific_dates
                                  )}
                                </span>
                              </div>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Services Summary */}
      {data.selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Selected Services Summary</span>
            </CardTitle>
            <CardDescription>
              Review your selected services and their frequencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.selectedServices.map((service) => {
                const startDate = state.data.scheduled_date ? new Date(state.data.scheduled_date) : new Date();
                const endDate = state.data.return_date ? new Date(state.data.return_date) : new Date();
                
                let perVisitCost = 0;
                switch (service.pricing_method) {
                  case 'per_visit':
                    perVisitCost = service.per_visit_cost || 0;
                    break;
                  case 'per_hour':
                    perVisitCost = (service.per_hour_cost || 0) * (service.estimated_duration_hours || 1);
                    break;
                  case 'flat_rate':
                    perVisitCost = service.flat_rate_cost || 0;
                    break;
                }

                const calculation = calculateServiceVisits({
                  startDate,
                  endDate,
                  frequency: service.frequency,
                  customFrequencyDays: service.custom_frequency_days,
                  customDaysOfWeek: service.custom_days_of_week,
                  customSpecificDates: service.custom_specific_dates,
                  includeDropoffService: service.include_dropoff_service,
                  includePickupService: service.include_pickup_service,
                  perVisitCost,
                  serviceTime: '09:00',
                  timezone: 'America/New_York'
                });

                return (
                  <div key={service.id} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {calculation.summary}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Subtotal */}
      {data.selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Services Subtotal</span>
              </span>
              <div className="flex items-center space-x-2">
                {data.package_override?.enabled && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold border-0">
                    Package Deal
                  </Badge>
                )}
                <span>${data.servicesSubtotal.toFixed(2)}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Package Override Controls */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="package-override"
                      checked={data.package_override?.enabled || false}
                      onCheckedChange={(checked) => {
                        const calculatedSubtotal = data.selectedServices.reduce((sum, service) => sum + service.calculated_cost, 0);
                        updatePackageOverride(checked, checked ? calculatedSubtotal : undefined);
                      }}
                    />
                    <Label htmlFor="package-override" className="text-sm font-medium">
                      Set package price for all services
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-9">
                    Override the calculated total with a custom package price. Individual service schedules remain unchanged.
                  </p>
                </div>
              </div>
              {data.package_override?.enabled && (
                <div className="ml-6 space-y-3 p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Calculated subtotal:</span>
                      <span className="line-through">
                        ${data.selectedServices.reduce((sum, service) => sum + service.calculated_cost, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="package-amount" className="text-sm font-medium">Package Price</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={data.package_override.amount || 0}
                          onChange={(e) => {
                            const newAmount = parseFloat(e.target.value) || 0;
                            updatePackageOverride(true, newAmount);
                          }}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Replaces calculated line totals. Visits are still scheduled; billing uses this total.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver and Vehicle Assignment Section */}
      {data.selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Driver & Vehicle Assignment</span>
            </CardTitle>
            <CardDescription>
              You can assign a driver and vehicle for service jobs now, or leave this blank and let dispatch schedule later
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Driver and Vehicle Assignment - Single Row */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Driver Assignment */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="same-driver"
                      checked={data.useSameDriverForAll || false}
                      onCheckedChange={toggleUseSameDriver}
                    />
                    <Label htmlFor="same-driver" className="font-medium">
                      Schedule same driver for all services
                      {data.useSameDriverForAll && assignedDriver && (
                        <span className="text-primary font-semibold ml-2">
                          ({assignedDriver.first_name} {assignedDriver.last_name})
                        </span>
                      )}
                    </Label>
                  </div>
                  
                  {data.scheduledDriverForAll && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                          {data.scheduledDriverForAll.first_name?.[0]}{data.scheduledDriverForAll.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{data.scheduledDriverForAll.first_name} {data.scheduledDriverForAll.last_name}</p>
                          <p className="text-sm text-muted-foreground">Status: {data.scheduledDriverForAll.status}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Assignment */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="same-vehicle"
                      checked={data.useSameVehicleForAll || false}
                      onCheckedChange={toggleUseSameVehicle}
                    />
                    <Label htmlFor="same-vehicle" className="font-medium">
                      Schedule same vehicle for all services
                      {data.useSameVehicleForAll && assignedVehicle && (
                        <span className="text-primary font-semibold ml-2">
                          ({assignedVehicle.year} {assignedVehicle.make} {assignedVehicle.model})
                        </span>
                      )}
                    </Label>
                  </div>
                  
                  {data.scheduledVehicleForAll && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Truck className="h-5 w-5 text-white" />
                        </div>
                         <div>
                           <p className="font-medium">
                             {data.scheduledVehicleForAll.year} {data.scheduledVehicleForAll.make} {data.scheduledVehicleForAll.model}
                             {data.scheduledVehicleForAll.nickname && ` "${data.scheduledVehicleForAll.nickname}"`}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             {data.scheduledVehicleForAll.license_plate}
                           </p>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Group Assignment Toggle Buttons */}
            <div className="pt-6 border-t space-y-3">
              <div className="flex items-center space-x-2">
                <Button
                  variant={data.groupAssignmentsByDay ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdate({
                    ...data,
                    groupAssignmentsByDay: true,
                    expandedDays: new Set() // Reset expanded days when toggling
                  })}
                  className="w-56"
                >
                  Group Assignments by Day
                </Button>
                <Button
                  variant={!data.groupAssignmentsByDay ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdate({
                    ...data,
                    groupAssignmentsByDay: false,
                    expandedDays: new Set() // Reset expanded days when toggling
                  })}
                  className="w-56"
                >
                  Group Assignments by Service
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.groupAssignmentsByDay 
                  ? "Assign drivers and vehicles once per date. All services on that day will use the same assignments. Expand any day to override assignments for specific services."
                  : "Assign drivers and vehicles for each service separately. Use this view if different services on the same day require different assignments."
                }
              </p>
            </div>

            {/* Service Date Assignments */}
            <div className="space-y-4 pt-4">
              {data.groupAssignmentsByDay ? (
                // Group by Day View
                (() => {
                  // Collect all unique dates across all services
                  const allDates = new Map<string, { date: Date; displayDate: string; services: Array<{ id: string; name: string; }> }>();
                  
                  data.selectedServices.forEach((service) => {
                    const startDate = state.data.scheduled_date ? new Date(state.data.scheduled_date) : new Date();
                    const endDate = state.data.return_date ? new Date(state.data.return_date) : new Date();
                    
                    let perVisitCost = 0;
                    switch (service.pricing_method) {
                      case 'per_visit':
                        perVisitCost = service.per_visit_cost || 0;
                        break;
                      case 'per_hour':
                        perVisitCost = (service.per_hour_cost || 0) * (service.estimated_duration_hours || 1);
                        break;
                      case 'flat_rate':
                        perVisitCost = service.flat_rate_cost || 0;
                        break;
                    }

                    const calculation = calculateServiceVisits({
                      startDate,
                      endDate,
                      frequency: service.frequency,
                      customFrequencyDays: service.custom_frequency_days,
                      customDaysOfWeek: service.custom_days_of_week,
                      customSpecificDates: service.custom_specific_dates,
                      includeDropoffService: service.include_dropoff_service,
                      includePickupService: service.include_pickup_service,
                      perVisitCost,
                      serviceTime: '09:00',
                      timezone: 'America/New_York'
                    });

                    calculation.visits.forEach((visit) => {
                      const dateKey = format(visit.date, 'yyyy-MM-dd');
                      if (!allDates.has(dateKey)) {
                        allDates.set(dateKey, {
                          date: visit.date,
                          displayDate: visit.displayDate,
                          services: []
                        });
                      }
                      allDates.get(dateKey)!.services.push({ id: service.id, name: service.name });
                    });
                  });

                  // Sort dates chronologically
                  const sortedDates = Array.from(allDates.entries()).sort(([a], [b]) => a.localeCompare(b));

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Service Schedule</Label>
                        <p className="text-xs text-muted-foreground">
                          Select the + icon to override driver/vehicle for any day
                        </p>
                      </div>
                      {sortedDates.map(([dateKey, dateInfo]) => {
                        const dayAssignment = data.dayAssignments?.[dateKey];
                        const isExpanded = data.expandedDays?.has(dateKey);
                        
                        return (
                          <div key={dateKey} className="space-y-2">
                            {/* Day Assignment Row */}
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                              <div className="flex items-center space-x-3">
                                <div className="text-sm font-medium">{dateInfo.displayDate}</div>
                                <div className="text-sm text-muted-foreground">—</div>
                                <div className="space-y-1">
                                  {dateInfo.services.map((service, index) => (
                                    <div key={service.id} className="text-xs text-muted-foreground">
                                      {service.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                               <div className="flex items-center space-x-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   className="flex items-center gap-1 h-8"
                                   disabled={data.useSameDriverForAll}
                                   onClick={() => openDriverModalForDay(dateKey, dateInfo.date)}
                                 >
                                   <User className="h-3 w-3" />
                                   <span className={cn(
                                     "text-xs",
                                     (dayAssignment?.driver || hasOverridesForDay(dateKey)) && "text-muted-foreground opacity-70"
                                   )}>
                                     {data.useSameDriverForAll && data.scheduledDriverForAll 
                                       ? `${data.scheduledDriverForAll.first_name} ${data.scheduledDriverForAll.last_name}`
                                       : dayAssignment?.driver
                                       ? `${dayAssignment.driver.first_name} ${dayAssignment.driver.last_name}`
                                       : assignedDriver
                                       ? `${assignedDriver.first_name} ${assignedDriver.last_name}`
                                       : 'Assign Driver'
                                     }
                                   </span>
                                   {dayAssignment?.driver && (
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-4 w-4 p-0 ml-1"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         confirmRemoveOverride('driver', undefined, undefined, dateKey);
                                       }}
                                     >
                                       <X className="h-2 w-2" />
                                     </Button>
                                   )}
                                 </Button>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   className="flex items-center gap-1 h-8"
                                   disabled={data.useSameVehicleForAll}
                                   onClick={() => openVehicleModalForDay(dateKey, dateInfo.date)}
                                 >
                                   <Truck className="h-3 w-3" />
                                   <span className={cn(
                                     "text-xs",
                                     (dayAssignment?.vehicle || hasOverridesForDay(dateKey)) && "text-muted-foreground opacity-70"
                                   )}>
                                     {data.useSameVehicleForAll && data.scheduledVehicleForAll 
                                       ? `${data.scheduledVehicleForAll.year} ${data.scheduledVehicleForAll.make} ${data.scheduledVehicleForAll.model}`
                                       : dayAssignment?.vehicle
                                       ? `${dayAssignment.vehicle.year} ${dayAssignment.vehicle.make} ${dayAssignment.vehicle.model}`
                                       : assignedVehicle
                                       ? `${assignedVehicle.year} ${assignedVehicle.make} ${assignedVehicle.model}`
                                       : 'Assign Vehicle'
                                     }
                                   </span>
                                   {dayAssignment?.vehicle && (
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-4 w-4 p-0 ml-1"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         confirmRemoveOverride('vehicle', undefined, undefined, dateKey);
                                       }}
                                     >
                                       <X className="h-2 w-2" />
                                     </Button>
                                   )}
                                 </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => toggleDayExpansion(dateKey)}
                                >
                                  <span className="text-xs">{isExpanded ? '−' : '+'}</span>
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Individual Services */}
                            {isExpanded && (
                              <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
                                {dateInfo.services.map((serviceInfo) => {
                                  const service = data.selectedServices.find(s => s.id === serviceInfo.id);
                                  if (!service) return null;
                                  
                                  const individualAssignment = getIndividualAssignment(service.id, dateKey);
                                  
                                  return (
                                    <div key={service.id} className="flex items-center justify-between p-2 border rounded bg-muted/30">
                                      <div className="text-sm">{service.name}</div>
                                       <div className="flex items-center space-x-2">
                                         <Button
                                           variant="outline"
                                           size="sm"
                                           className="flex items-center gap-1 h-7"
                                           onClick={() => openDriverModalForDate(service.id, dateInfo.date, dateKey)}
                                         >
                                           <User className="h-3 w-3" />
                                           <span className="text-xs">
                                             {individualAssignment?.driver
                                               ? `${individualAssignment.driver.first_name} ${individualAssignment.driver.last_name}`
                                               : 'Override'
                                             }
                                           </span>
                                           {individualAssignment?.driver && (
                                             <Button
                                               variant="ghost"
                                               size="sm"
                                               className="h-4 w-4 p-0 ml-1"
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 confirmRemoveOverride('driver', service.id, dateKey);
                                               }}
                                             >
                                               <X className="h-2 w-2" />
                                             </Button>
                                           )}
                                         </Button>
                                         <Button
                                           variant="outline"
                                           size="sm"
                                           className="flex items-center gap-1 h-7"
                                           onClick={() => openVehicleModalForDate(service.id, dateInfo.date, dateKey)}
                                         >
                                           <Truck className="h-3 w-3" />
                                           <span className="text-xs">
                                             {individualAssignment?.vehicle
                                               ? `${individualAssignment.vehicle.year} ${individualAssignment.vehicle.make}`
                                               : 'Override'
                                             }
                                           </span>
                                           {individualAssignment?.vehicle && (
                                             <Button
                                               variant="ghost"
                                               size="sm"
                                               className="h-4 w-4 p-0 ml-1"
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 confirmRemoveOverride('vehicle', service.id, dateKey);
                                               }}
                                             >
                                               <X className="h-2 w-2" />
                                             </Button>
                                           )}
                                         </Button>
                                       </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                // Individual Service View (existing functionality)
                <div className="space-y-4">
                  {data.selectedServices.map((service) => {
                  const startDate = state.data.scheduled_date ? new Date(state.data.scheduled_date) : new Date();
                  const endDate = state.data.return_date ? new Date(state.data.return_date) : new Date();
                  
                  let perVisitCost = 0;
                  switch (service.pricing_method) {
                    case 'per_visit':
                      perVisitCost = service.per_visit_cost || 0;
                      break;
                    case 'per_hour':
                      perVisitCost = (service.per_hour_cost || 0) * (service.estimated_duration_hours || 1);
                      break;
                    case 'flat_rate':
                      perVisitCost = service.flat_rate_cost || 0;
                      break;
                  }

                  const calculation = calculateServiceVisits({
                    startDate,
                    endDate,
                    frequency: service.frequency,
                    customFrequencyDays: service.custom_frequency_days,
                    customDaysOfWeek: service.custom_days_of_week,
                    customSpecificDates: service.custom_specific_dates,
                    includeDropoffService: service.include_dropoff_service,
                    includePickupService: service.include_pickup_service,
                    perVisitCost,
                    serviceTime: '09:00',
                    timezone: 'America/New_York'
                  });

                  if (calculation.visits.length === 0) return null;

                  return (
                      <div key={service.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">Service Schedule</span>
                            <span className="text-sm text-muted-foreground">—</span>
                            <span className="font-medium text-sm text-muted-foreground">
                              {service.name} ({calculation.visits.length} visit{calculation.visits.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select the + icon to override driver/vehicle for any day
                          </p>
                        </div>
                      <div className="space-y-2">
                        {calculation.visits.map((visit, index) => {
                          const dateKey = format(visit.date, 'yyyy-MM-dd');
                          const individualAssignment = getIndividualAssignment(service.id, dateKey);
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                              <div className="flex items-center space-x-3">
                                <div className="text-sm font-medium">{visit.displayDate}</div>
                                <div className="text-sm text-muted-foreground">—</div>
                                <div className="text-sm text-muted-foreground">{service.name}</div>
                              </div>
                               <div className="flex items-center space-x-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   className="flex items-center gap-1 h-8"
                                   disabled={data.useSameDriverForAll}
                                   onClick={() => openDriverModalForDate(service.id, visit.date, dateKey)}
                                 >
                                   <User className="h-3 w-3" />
                                   <span className={cn(
                                     "text-xs",
                                     individualAssignment?.driver && "text-muted-foreground opacity-70"
                                   )}>
                                     {data.useSameDriverForAll && data.scheduledDriverForAll 
                                       ? `${data.scheduledDriverForAll.first_name} ${data.scheduledDriverForAll.last_name}`
                                       : individualAssignment?.driver
                                       ? `${individualAssignment.driver.first_name} ${individualAssignment.driver.last_name}`
                                       : assignedDriver
                                       ? `${assignedDriver.first_name} ${assignedDriver.last_name}`
                                       : 'Assign Driver'
                                     }
                                   </span>
                                   {individualAssignment?.driver && (
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-4 w-4 p-0 ml-1"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         confirmRemoveOverride('driver', service.id, dateKey);
                                       }}
                                     >
                                       <X className="h-2 w-2" />
                                     </Button>
                                   )}
                                 </Button>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   className="flex items-center gap-1 h-8"
                                   disabled={data.useSameVehicleForAll}
                                   onClick={() => openVehicleModalForDate(service.id, visit.date, dateKey)}
                                 >
                                   <Truck className="h-3 w-3" />
                                   <span className={cn(
                                     "text-xs",
                                     individualAssignment?.vehicle && "text-muted-foreground opacity-70"
                                   )}>
                                     {data.useSameVehicleForAll && data.scheduledVehicleForAll 
                                       ? `${data.scheduledVehicleForAll.year} ${data.scheduledVehicleForAll.make} ${data.scheduledVehicleForAll.model}`
                                       : individualAssignment?.vehicle
                                       ? `${individualAssignment.vehicle.year} ${individualAssignment.vehicle.make} ${individualAssignment.vehicle.model}`
                                       : assignedVehicle
                                       ? `${assignedVehicle.year} ${assignedVehicle.make} ${assignedVehicle.model}`
                                       : 'Assign Vehicle'
                                     }
                                   </span>
                                   {individualAssignment?.vehicle && (
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-4 w-4 p-0 ml-1"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         confirmRemoveOverride('vehicle', service.id, dateKey);
                                       }}
                                     >
                                       <X className="h-2 w-2" />
                                     </Button>
                                   )}
                                 </Button>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                     </div>
                   );
                 })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Selection Modal */}
      <DriverSelectionModal
        open={showDriverModal}
        onOpenChange={(open) => {
          setShowDriverModal(open);
          if (!open) {
            setSelectedServiceId('');
            setSelectedDateKey('');
            setSelectedDayForAssignment('');
          }
        }}
        selectedDate={selectedServiceDate}
        selectedDriver={selectedServiceId && selectedDateKey 
          ? getIndividualAssignment(selectedServiceId, selectedDateKey)?.driver || data.scheduledDriverForAll
          : data.scheduledDriverForAll
        }
        onDriverSelect={handleDriverSelect}
      />

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        open={showVehicleModal}
        onOpenChange={(open) => {
          setShowVehicleModal(open);
          if (!open) {
            setSelectedServiceId('');
            setSelectedDateKey('');
            setSelectedDayForAssignment('');
          }
        }}
        selectedDate={selectedServiceDate}
        selectedVehicle={selectedServiceId && selectedDateKey 
          ? getIndividualAssignment(selectedServiceId, selectedDateKey)?.vehicle || data.scheduledVehicleForAll
          : data.scheduledVehicleForAll
        }
        onVehicleSelect={handleVehicleSelect}
      />

      {/* Remove Override Confirmation Dialog */}
      <AlertDialog open={showRemoveOverrideDialog} onOpenChange={setShowRemoveOverrideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Override</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this {overrideToRemove?.type} override? 
              The assignment will revert to the default or higher-level assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeOverride}>
              Remove Override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};