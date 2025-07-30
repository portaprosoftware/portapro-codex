import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Settings, Clock, DollarSign, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  custom_specific_dates?: number[]; // [8, 16, 25] for day of month
  calculated_cost: number;
}

interface ServicesFrequencyData {
  selectedServices: ServiceItem[];
  servicesSubtotal: number;
}

interface ServicesFrequencyStepProps {
  data: ServicesFrequencyData;
  onUpdate: (data: ServicesFrequencyData) => void;
}

export const ServicesFrequencyStep: React.FC<ServicesFrequencyStepProps> = ({ 
  data, 
  onUpdate 
}) => {
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        calculated_cost: 0
      }));

      setAvailableServices(services);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateServicesSubtotal = () => {
    const subtotal = data.selectedServices.reduce((sum, service) => 
      sum + service.calculated_cost, 0
    );
    
    onUpdate({
      ...data,
      servicesSubtotal: subtotal
    });
  };

  const calculateServiceCost = (service: ServiceItem): number => {
    let baseCost = 0;
    
    switch (service.pricing_method) {
      case 'per_visit':
        baseCost = service.per_visit_cost || 0;
        break;
      case 'per_hour':
        baseCost = (service.per_hour_cost || 0) * (service.estimated_duration_hours || 1);
        break;
      case 'flat_rate':
        baseCost = service.flat_rate_cost || 0;
        break;
    }

    // For recurring services, this is the per-occurrence cost
    // The frequency is informational for scheduling
    return baseCost;
  };

  const toggleService = (serviceId: string, selected: boolean) => {
    if (selected) {
      const service = availableServices.find(s => s.id === serviceId);
      if (service) {
        const serviceWithCost = {
          ...service,
          selected: true,
          frequency: 'one-time' as const, // Default frequency when first selected
          calculated_cost: calculateServiceCost(service)
        };
        
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
        const updatedService = {
          ...service,
          frequency: frequency as ServiceItem['frequency'],
          calculated_cost: calculateServiceCost(service)
        };
        
        // Set default custom type when switching to custom
        if (frequency === 'custom' && !updatedService.custom_type) {
          updatedService.custom_type = 'days_interval';
          updatedService.custom_frequency_days = 1;
        }
        
        return updatedService;
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
        return {
          ...service,
          custom_frequency_days: days
        };
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

  const updateCustomSpecificDates = (serviceId: string, dates: number[]) => {
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

  const getPricingDisplay = (service: ServiceItem) => {
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

  const getFrequencyLabel = (frequency: string, customType?: string, customDays?: number, daysOfWeek?: string[], specificDates?: number[]) => {
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
          return specificDates?.length ? `Days: ${specificDates.join(', ')}` : 'Select dates';
        }
        return 'Custom';
      default: return 'One-Time';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Settings className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Services & Frequency</h2>
        <p className="text-muted-foreground">Select additional services and set their frequency</p>
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
                              <Badge variant="outline">{service.service_code}</Badge>
                            )}
                            <Badge className="bg-green-100 text-green-800">
                              {getPricingDisplay(service)}
                            </Badge>
                            {service.estimated_duration_hours && (
                              <Badge variant="outline" className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{service.estimated_duration_hours}h</span>
                              </Badge>
                            )}
                            {isSelected && (
                              <Badge className="bg-blue-100 text-blue-800">
                                ${selectedService?.calculated_cost.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Frequency Selection - Only show when service is selected */}
                      {isSelected && selectedService && (
                        <div className="border-t pt-3 mt-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
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
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {selectedService.frequency === 'custom' && (
                              <div className="w-full mt-3 space-y-3">
                                <div>
                                  <Label className="text-sm font-medium">Custom Type</Label>
                                  <Select
                                    value={selectedService.custom_type || 'days_interval'}
                                    onValueChange={(value) => updateCustomType(service.id, value)}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="days_interval">Every X Days</SelectItem>
                                      <SelectItem value="days_of_week">Specific Days of Week</SelectItem>
                                      <SelectItem value="specific_dates">Specific Dates</SelectItem>
                                    </SelectContent>
                                  </Select>
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
                                    <Label className="text-sm font-medium">Select Specific Days of Month</Label>
                                    <div className="mt-1">
                                      <Input
                                        placeholder="Enter days separated by commas (e.g., 8, 16, 25)"
                                        value={selectedService.custom_specific_dates?.join(', ') || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value.trim() === '') {
                                            updateCustomSpecificDates(service.id, []);
                                          } else {
                                            const dates = value.split(',')
                                              .map(d => parseInt(d.trim()))
                                              .filter(d => !isNaN(d) && d >= 1 && d <= 31);
                                            updateCustomSpecificDates(service.id, dates);
                                          }
                                        }}
                                      />
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Enter day numbers 1-31, separated by commas
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground mt-2">
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
              {data.selectedServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {getFrequencyLabel(
                        service.frequency,
                        service.custom_type,
                        service.custom_frequency_days,
                        service.custom_days_of_week,
                        service.custom_specific_dates
                      )}
                      {service.frequency === 'custom' && service.custom_type === 'days_interval' && service.custom_frequency_days && 
                        ` (every ${service.custom_frequency_days} days)`
                      } • {getPricingDisplay(service)}
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    ${service.calculated_cost.toFixed(2)}
                  </Badge>
                </div>
              ))}
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
              <span>${data.servicesSubtotal.toFixed(2)}</span>
            </CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};