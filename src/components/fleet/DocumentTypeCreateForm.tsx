import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface DocumentTypeFormData {
  name: string;
  description: string;
  category: string;
}

interface Props {
  onSaved?: () => void;
  onCancel?: () => void;
}

// Predefined document categories matching the DocumentTypeSelector
const predefinedCategories = [
  {
    id: "compliance-regulatory",
    name: "Compliance & Regulatory",
    icon: "🧾",
    description: "Government, DOT, and waste permits",
  },
  {
    id: "safety-training",
    name: "Safety & Training",
    icon: "🛡️",
    description: "Training, spill kits, PPE, and safety data",
  },
  {
    id: "licensing-registration",
    name: "Licensing & Registration", 
    icon: "📑",
    description: "Permits to operate and certifications",
  },
  {
    id: "insurance-inspection",
    name: "Insurance & Inspection",
    icon: "📋", 
    description: "Coverage and routine checks",
  }
];

export const DocumentTypeCreateForm: React.FC<Props> = ({ onSaved, onCancel }) => {
  const [formData, setFormData] = useState<DocumentTypeFormData>({
    name: "",
    description: "",
    category: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: DocumentTypeFormData) => {
      const { error } = await supabase
        .from("compliance_document_types")
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-document-types"] });
      toast({
        title: "Success",
        description: "Custom document type created successfully.",
      });
      onSaved?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create document type.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast({
        title: "Error",
        description: "Please select a category for the document type.",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {predefinedCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Custom Permit, Special Certification"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description of this document type"
          rows={3}
        />
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={createMutation.isPending}>
          Create Document Type
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};