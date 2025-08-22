import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileText, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

interface ServiceTemplateAssignmentModalProps {
  serviceId: string | null;
  serviceName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  template_type: string;
  is_public: boolean;
}

interface Service {
  id: string;
  name: string;
  default_template_id: string | null;
  template?: {
    id: string;
    name: string;
  } | null;
}

export const ServiceTemplateAssignmentModal: React.FC<ServiceTemplateAssignmentModalProps> = ({
  serviceId,
  serviceName,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Fetch available templates
  const { data: templates = [] } = useQuery({
    queryKey: ["maintenance-report-templates", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_report_templates")
        .select("id, name, description, template_type, is_public")
        .eq("is_active", true)
        .eq("is_public", true)
        .order("name");
      
      if (error) throw error;
      return data as Template[];
    },
    enabled: isOpen,
  });

  // Fetch current service info
  const { data: serviceInfo } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          template:maintenance_report_templates!default_template_id(
            id,
            name
          )
        `)
        .eq("id", serviceId)
        .single();
      
      if (error) throw error;
      return data as Service;
    },
    enabled: !!serviceId && isOpen,
  });

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: async (templateId: string | null) => {
      if (!serviceId) throw new Error("No service selected");
      
      const { error } = await supabase
        .from("services")
        .update({ default_template_id: templateId })
        .eq("id", serviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["service", serviceId] });
      toast.success("Template assignment updated successfully");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update template assignment");
      console.error("Assignment error:", error);
    },
  });

  const handleAssign = () => {
    if (selectedTemplateId) {
      assignMutation.mutate(selectedTemplateId);
    }
  };

  const handleRemove = () => {
    assignMutation.mutate(null);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assign Default Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{serviceName}</h3>
                <p className="text-sm text-gray-600">
                  Currently assigned: {serviceInfo?.template?.name || "No template"}
                </p>
              </div>
              {serviceInfo?.template && (
                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                  {serviceInfo.template.name}
                </Badge>
              )}
            </div>
          </Card>

          {/* Template Selection */}
          <div className="space-y-3">
            <Label htmlFor="template-select" className="text-sm font-medium">
              Select Template
            </Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {template.template_type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Assignment */}
          {selectedTemplateId && (
            <Card className="p-4 border-green-200 bg-green-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">{serviceName}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-green-600" />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    {templates.find(t => t.id === selectedTemplateId)?.name}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            
            {serviceInfo?.template && (
              <Button 
                variant="outline" 
                onClick={handleRemove}
                disabled={assignMutation.isPending}
                className="text-red-600 hover:text-red-700 border-red-200"
              >
                Remove Current Template
              </Button>
            )}
            
            <Button
              onClick={handleAssign}
              disabled={!selectedTemplateId || assignMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {assignMutation.isPending ? "Assigning..." : "Assign Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};