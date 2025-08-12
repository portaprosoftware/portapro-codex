import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, X, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface LogPastServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Service {
  id: string;
  name: string;
  code: string;
  category: string;
  default_template_id?: string;
}

interface Customer {
  id: string;
  name: string;
}

export const LogPastServiceModal: React.FC<LogPastServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [serviceDate, setServiceDate] = useState<Date>(new Date());
  const [serviceTime, setServiceTime] = useState("09:00");
  const [formData, setFormData] = useState({
    service_id: "",
    customer_id: "",
    location: "",
    performed_by: "",
    notes: "",
    photos: [] as File[],
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, code, category, default_template_id')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Service[];
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

  const logServiceMutation = useMutation({
    mutationFn: async () => {
      if (!formData.service_id || !formData.customer_id) {
        throw new Error('Service and customer are required');
      }

      // First, create a completed job record for history
      const jobData = {
        customer_id: formData.customer_id,
        job_type: 'service',
        status: 'completed',
        scheduled_date: format(serviceDate, 'yyyy-MM-dd'),
        scheduled_time: serviceTime,
        actual_completion: new Date().toISOString(),
        notes: `Past service logged: ${formData.notes}`,
        service_id: formData.service_id,
      };

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single();

      if (jobError) throw jobError;

      // Then create the service record
      const reportData = {
        customer_name: customers?.find(c => c.id === formData.customer_id)?.name,
        location: formData.location,
        service_type: services?.find(s => s.id === formData.service_id)?.name,
        service_date: format(serviceDate, "yyyy-MM-dd"),
        service_time: serviceTime,
        performed_by: formData.performed_by,
        notes: formData.notes,
        photos_count: formData.photos.length,
      };

      const selectedService = services?.find(s => s.id === formData.service_id);

      const { error: reportError } = await supabase
        .from('maintenance_reports')
        .insert([{
          job_id: job.id,
          customer_id: formData.customer_id,
          template_id: selectedService?.default_template_id || null,
          source_type: 'manual',
          source_id: job.id,
          service_id: formData.service_id,
          auto_generated: false,
          status: 'completed',
          completion_percentage: 100,
          report_data: reportData,
          created_at: new Date(serviceDate.getTime() + 
            parseInt(serviceTime.split(':')[0]) * 60 * 60 * 1000 + 
            parseInt(serviceTime.split(':')[1]) * 60 * 1000).toISOString(),
        }]);

      if (reportError) throw reportError;

      // TODO: Handle photo uploads if needed
      if (formData.photos.length > 0) {
        console.log('Photo uploads would be handled here');
      }

      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-reports'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Past service logged successfully');
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to log past service');
      console.error(error);
    }
  });

  const resetForm = () => {
    setServiceDate(new Date());
    setServiceTime("09:00");
    setFormData({
      service_id: "",
      customer_id: "",
      location: "",
      performed_by: "",
      notes: "",
      photos: [],
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logServiceMutation.mutate();
  };

  const selectedService = services?.find(s => s.id === formData.service_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Past Service</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Selection */}
          <div>
            <Label htmlFor="service">Service (Required)</Label>
            <Select
              value={formData.service_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service from catalog" />
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center gap-2">
                      <span>{service.name}</span>
                      <span className="text-xs text-gray-500">({service.category})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(serviceDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={serviceDate}
                    onSelect={(date) => date && setServiceDate(date)}
                    initialFocus
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={serviceTime}
                onChange={(e) => setServiceTime(e.target.value)}
              />
            </div>
          </div>

          {/* Customer and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer (Required)</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              >
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

            <div>
              <Label htmlFor="location">Service Location</Label>
              <Input
                id="location"
                placeholder="Enter location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          {/* Performed By */}
          <div>
            <Label htmlFor="performed_by">Performed By</Label>
            <Input
              id="performed_by"
              placeholder="Enter technician name"
              value={formData.performed_by}
              onChange={(e) => setFormData(prev => ({ ...prev, performed_by: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter any additional notes about the service..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Photos */}
          <div>
            <Label htmlFor="photos">Photos (Optional)</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Button type="button" variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photos
                </Button>
              </div>
              
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <div className="bg-gray-100 p-2 rounded text-xs text-center">
                        {photo.name}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Service Details Preview */}
          {selectedService && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Service Details</h4>
              <div className="text-sm text-blue-800">
                <p><strong>Service:</strong> {selectedService.name}</p>
                <p><strong>Category:</strong> {selectedService.category}</p>
                <p><strong>Code:</strong> {selectedService.code}</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={logServiceMutation.isPending || !formData.service_id || !formData.customer_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {logServiceMutation.isPending ? "Logging..." : "Log Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};