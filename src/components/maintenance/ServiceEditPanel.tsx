
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, FileText } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface ServiceEditPanelProps {
  serviceId: string | null;
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
}

interface ServiceFormData {
  name: string;
  service_code: string;
  description: string;
  pricing_method: string;
  per_visit_cost: number;
  per_hour_cost: number;
  flat_rate_cost: number;
  estimated_duration_hours: number;
  default_template_id: string | null;
}

export const ServiceEditPanel: React.FC<ServiceEditPanelProps> = ({
  serviceId,
  isOpen,
  isCreating,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { hasAdminAccess } = useUserRole();
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    service_code: "",
    description: "",
    pricing_method: "per_visit",
    per_visit_cost: 0,
    per_hour_cost: 0,
    flat_rate_cost: 0,
    estimated_duration_hours: 1,
    default_template_id: null,
  });

  // Query for available templates
  const { data: templates } = useQuery({
    queryKey: ["maintenance-report-templates", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_report_templates")
        .select("id, name, description")
        .eq("is_active", true)
        .eq("is_public", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const { data: service } = useQuery({
    queryKey: ["routine-maintenance-service", serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      
      const { data, error } = await supabase
        .from("routine_maintenance_services")
        .select("*")
        .eq("id", serviceId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId && !isCreating,
  });

  useEffect(() => {
    if (service && !isCreating) {
      setFormData({
        name: service.name || "",
        service_code: service.service_code || "",
        description: service.description || "",
        pricing_method: service.pricing_method || "per_visit",
        per_visit_cost: service.per_visit_cost || 0,
        per_hour_cost: service.per_hour_cost || 0,
        flat_rate_cost: service.flat_rate_cost || 0,
        estimated_duration_hours: service.estimated_duration_hours || 1,
        default_template_id: service.default_template_id || null,
      });
    } else if (isCreating) {
      setFormData({
        name: "",
        service_code: "",
        description: "",
        pricing_method: "per_visit",
        per_visit_cost: 0,
        per_hour_cost: 0,
        flat_rate_cost: 0,
        estimated_duration_hours: 1,
        default_template_id: null,
      });
    }
  }, [service, isCreating]);

  const saveMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      if (isCreating) {
        const { error } = await supabase
          .from("routine_maintenance_services")
          .insert([data]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("routine_maintenance_services")
          .update(data)
          .eq("id", serviceId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routine-maintenance-services"] });
      onClose();
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const updateFormData = (field: keyof ServiceFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[500px] max-w-[90vw]">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-bold">
            {isCreating ? "Create New Service" : "Edit Service"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Oil Change, Tire Rotation"
              />
            </div>

            <div>
              <Label htmlFor="service_code">Service Code</Label>
              <Input
                id="service_code"
                value={formData.service_code}
                onChange={(e) => updateFormData("service_code", e.target.value)}
                placeholder="e.g., OIL-001, TIRE-ROT"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Describe what this service includes..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="pricing_method">Pricing Method</Label>
              <Select
                value={formData.pricing_method}
                onValueChange={(value) => updateFormData("pricing_method", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_visit">Per Visit</SelectItem>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="flat_rate">Flat Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.pricing_method === "per_visit" && (
              <div>
                <Label htmlFor="per_visit_cost">Cost per Visit ($)</Label>
                <Input
                  id="per_visit_cost"
                  type="number"
                  value={formData.per_visit_cost}
                  onChange={(e) => updateFormData("per_visit_cost", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            )}

            {formData.pricing_method === "per_hour" && (
              <div>
                <Label htmlFor="per_hour_cost">Cost per Hour ($)</Label>
                <Input
                  id="per_hour_cost"
                  type="number"
                  value={formData.per_hour_cost}
                  onChange={(e) => updateFormData("per_hour_cost", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            )}

            {formData.pricing_method === "flat_rate" && (
              <div>
                <Label htmlFor="flat_rate_cost">Flat Rate ($)</Label>
                <Input
                  id="flat_rate_cost"
                  type="number"
                  value={formData.flat_rate_cost}
                  onChange={(e) => updateFormData("flat_rate_cost", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            )}

            <div>
              <Label htmlFor="estimated_duration_hours">Estimated Duration (hours)</Label>
              <Input
                id="estimated_duration_hours"
                type="number"
                value={formData.estimated_duration_hours}
                onChange={(e) => updateFormData("estimated_duration_hours", parseFloat(e.target.value) || 1)}
                placeholder="1.0"
                step="0.5"
                min="0.5"
              />
            </div>

            <div>
              <Label htmlFor="default_template_id" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Default Report Template
              </Label>
              <Select
                value={formData.default_template_id || "none"}
                onValueChange={(value) => updateFormData("default_template_id", value === "none" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No template assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col items-start">
                        <span>{template.name}</span>
                        {template.description && (
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This template will be automatically assigned to jobs using this service
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending || !formData.name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Service"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
