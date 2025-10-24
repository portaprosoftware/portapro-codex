import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

interface LogServiceManuallyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogServiceManuallyModal: React.FC<LogServiceManuallyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    service_id: "",
    completion_date: new Date().toISOString().split('T')[0],
    customer_id: "",
    location: "",
    technician: "",
    template_id: "",
    notes: "",
    duration: 60,
  });

  // Fetch active services
  const { data: services } = useQuery({
    queryKey: ['active-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, code, category, estimated_duration_minutes, default_template_id')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch active customers
  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch active report templates
  const { data: templates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_report_templates')
        .select('id, name, template_type')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Handle service selection - auto-populate duration and template
  const handleServiceChange = (serviceId: string) => {
    const selectedService = services?.find(s => s.id === serviceId);
    if (selectedService) {
      setFormData(prev => ({
        ...prev,
        service_id: serviceId,
        duration: selectedService.estimated_duration_minutes || 60,
        template_id: selectedService.default_template_id || prev.template_id,
      }));
    }
  };

  const saveManualLogMutation = useMutation({
    mutationFn: async () => {
      // Generate report number
      const { data: existingReports } = await supabase
        .from('maintenance_reports')
        .select('report_number')
        .ilike('report_number', 'MAN-%')
        .order('created_at', { ascending: false })
        .limit(1);

      let reportNumber = 'MAN-00001';
      if (existingReports && existingReports.length > 0) {
        const lastNumber = existingReports[0].report_number;
        const match = lastNumber.match(/MAN-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          reportNumber = `MAN-${nextNum.toString().padStart(5, '0')}`;
        }
      }

      const reportData = {
        report_number: reportNumber,
        service_id: formData.service_id,
        template_id: formData.template_id || null,
        customer_id: formData.customer_id || null,
        status: "completed",
        actual_completion: formData.completion_date,
        assigned_technician: formData.technician || null,
        completion_percentage: 100,
        auto_generated: false,
        report_data: {
          location: formData.location,
          notes: formData.notes,
          duration_minutes: formData.duration,
          manually_logged: true,
          logged_by: user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Unknown',
          logged_at: new Date().toISOString(),
        }
      };

      // Only include template_id and customer_id if they have values
      const insertData: any = {
        report_number: reportData.report_number,
        service_id: reportData.service_id,
        status: reportData.status,
        actual_completion: reportData.actual_completion,
        completion_percentage: reportData.completion_percentage,
        auto_generated: reportData.auto_generated,
        report_data: reportData.report_data,
      };

      if (formData.template_id) {
        insertData.template_id = formData.template_id;
      }
      if (formData.customer_id) {
        insertData.customer_id = formData.customer_id;
      }
      if (formData.technician) {
        insertData.assigned_technician = formData.technician;
      }

      const { error } = await supabase
        .from('maintenance_reports')
        .insert([insertData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-records'] });
      toast.success('Service logged successfully');
      onClose();
      // Reset form
      setFormData({
        service_id: "",
        completion_date: new Date().toISOString().split('T')[0],
        customer_id: "",
        location: "",
        technician: "",
        template_id: "",
        notes: "",
        duration: 60,
      });
    },
    onError: (error) => {
      toast.error('Failed to log service');
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_id) {
      toast.error('Please select a service');
      return;
    }
    saveManualLogMutation.mutate();
  };

  const selectedService = services?.find(s => s.id === formData.service_id);

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'cleaning':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'preventive_maintenance':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'corrective_maintenance':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'inspection':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'emergency_response':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Service Manually</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service">Service *</Label>
              <Select
                value={formData.service_id}
                onValueChange={handleServiceChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center gap-2">
                        <span>{service.name}</span>
                        <Badge className={`${getCategoryColor(service.category)} text-white font-bold text-xs`}>
                          {service.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="completion_date">Completion Date *</Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer (Optional)</Label>
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
              <Label htmlFor="location">Location/Address (Optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Service location"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="technician">Technician/Performed By (Optional)</Label>
            <Input
              id="technician"
              value={formData.technician}
              onChange={(e) => setFormData(prev => ({ ...prev, technician: e.target.value }))}
              placeholder="Who performed the service"
            />
          </div>

          {/* Report Template */}
          <div>
            <Label htmlFor="template">Service Report Template (Optional)</Label>
            <Select
              value={formData.template_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a report template or leave blank" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.template_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService?.default_template_id && (
              <p className="text-sm text-gray-500 mt-1">
                Default template pre-selected from service
              </p>
            )}
          </div>

          {/* Additional Information */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Any additional context or details"
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveManualLogMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {saveManualLogMutation.isPending ? "Logging..." : "Log Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
