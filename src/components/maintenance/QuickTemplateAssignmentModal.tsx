import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileText, ArrowRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickTemplateAssignmentModalProps {
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

export const QuickTemplateAssignmentModal: React.FC<QuickTemplateAssignmentModalProps> = ({
  serviceId,
  serviceName,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
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
    queryKey: ["routine-maintenance-service", serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      
      const { data, error } = await supabase
        .from("routine_maintenance_services")
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
        .from("routine_maintenance_services")
        .update({ default_template_id: templateId })
        .eq("id", serviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routine-maintenance-services"] });
      queryClient.invalidateQueries({ queryKey: ["routine-maintenance-service", serviceId] });
      toast({
        title: "Success",
        description: "Template assignment updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    assignMutation.mutate(selectedTemplateId || null);
  };

  const handleRemove = () => {
    assignMutation.mutate(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Template Assignment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Service: {serviceName}</h3>
                <p className="text-sm text-blue-700">
                  {serviceInfo?.template 
                    ? `Currently assigned: ${serviceInfo.template.name}`
                    : "No template currently assigned"
                  }
                </p>
              </div>
              {serviceInfo?.template && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  <FileText className="w-3 h-3 mr-1" />
                  {serviceInfo.template.name}
                </Badge>
              )}
            </div>
          </Card>

          {/* Template Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select New Template
              </label>
              <Select value={selectedTemplateId || "none"} onValueChange={(value) => setSelectedTemplateId(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <div>
                          <span className="font-medium">{template.name}</span>
                          {template.description && (
                            <div className="text-xs text-muted-foreground">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {selectedTemplateId && (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="font-medium">{serviceName}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium">
                      {templates.find(t => t.id === selectedTemplateId)?.name}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  This template will be automatically assigned to new jobs using this service
                </p>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {serviceInfo?.template && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  disabled={assignMutation.isPending}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Current Template
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={assignMutation.isPending || !selectedTemplateId}
                className="bg-green-600 hover:bg-green-700"
              >
                {assignMutation.isPending ? "Assigning..." : "Assign Template"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};