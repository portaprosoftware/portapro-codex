
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Save, X, Upload } from "lucide-react";

interface TemplateEditModalProps {
  templateId: string | null;
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  template_type: string;
  template_data: Record<string, any>;
}

const availableFields = [
  { id: "vehicle_info", label: "Vehicle Information", description: "License plate, make, model" },
  { id: "technician_signature", label: "Technician Signature", description: "Digital signature capture" },
  { id: "customer_signature", label: "Customer Signature", description: "Customer approval signature" },
  { id: "service_photos", label: "Service Photos", description: "Photo gallery for documentation" },
  { id: "parts_used", label: "Parts Used", description: "List of replacement parts" },
  { id: "labor_hours", label: "Labor Hours", description: "Time tracking for service" },
  { id: "service_notes", label: "Service Notes", description: "Detailed service description" },
  { id: "next_service_date", label: "Next Service Date", description: "Recommended next maintenance" },
];

export const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  templateId,
  isOpen,
  isCreating,
  onClose,
}) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    description: "",
    template_type: "maintenance",
    template_data: {},
  });

  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const { data: template } = useQuery({
    queryKey: ["maintenance-report-template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from("maintenance_report_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId && !isCreating,
  });

  useEffect(() => {
    if (template && !isCreating) {
      setFormData({
        name: template.name || "",
        description: template.description || "",
        template_type: template.template_type || "maintenance",
        template_data: template.template_data || {},
      });
      setSelectedFields(Object.keys(template.template_data || {}));
    } else if (isCreating) {
      setFormData({
        name: "",
        description: "",
        template_type: "maintenance",
        template_data: {},
      });
      setSelectedFields([]);
    }
  }, [template, isCreating]);

  const saveMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const templateData = {
        ...data,
        template_data: selectedFields.reduce((acc, fieldId) => {
          acc[fieldId] = availableFields.find(f => f.id === fieldId) || {};
          return acc;
        }, {} as Record<string, any>),
      };

      if (isCreating) {
        const { error } = await supabase
          .from("maintenance_report_templates")
          .insert([templateData]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("maintenance_report_templates")
          .update(templateData)
          .eq("id", templateId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-report-templates"] });
      onClose();
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const updateFormData = (field: keyof TemplateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isCreating ? "Create Report Template" : "Edit Report Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Panel - Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Standard Service Report"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Describe this template's purpose..."
                rows={2}
              />
            </div>

            <div>
              <Label>Company Logo</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload logo</p>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Select Fields</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableFields.map((field) => (
                  <div key={field.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50">
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={field.id} className="font-medium">
                        {field.label}
                      </Label>
                      <p className="text-xs text-gray-500">{field.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Live Preview</Label>
            <Card className="p-6 bg-white min-h-[500px]">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold">
                    {formData.name || "Template Preview"}
                  </h2>
                </div>

                <div className="space-y-3">
                  {selectedFields.map((fieldId) => {
                    const field = availableFields.find(f => f.id === fieldId);
                    return (
                      <div key={fieldId} className="border rounded p-3">
                        <Label className="text-sm font-medium">{field?.label}</Label>
                        <div className="h-8 bg-gray-100 rounded mt-1"></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
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
            {saveMutation.isPending ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
