import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Settings, FileText, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  default_reminder_days: number;
  is_active: boolean;
  category?: string;
}

interface DocumentTypeFormData {
  name: string;
  description: string;
  category: string;
}

interface TypeDisplayItem {
  name: string;
  isPredefined: boolean;
  id?: string;
  description?: string | null;
  default_reminder_days?: number;
  is_active?: boolean;
  category?: string;
}

// Predefined document categories matching the DocumentTypeSelector
const predefinedCategories = [
  {
    id: "compliance-regulatory",
    name: "Compliance & Regulatory",
    icon: "🧾",
    color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0",
    description: "Government, DOT, and waste permits",
    types: [
      "Annual DOT Inspection",
      "DOT/FMCSA DVIR Log", 
      "DOT Permit",
      "Emissions Certificate",
      "State Septage Hauler Permit",
      "WWTP Disposal Manifest"
    ]
  },
  {
    id: "safety-training",
    name: "Safety & Training",
    icon: "🛡️",
    color: "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0",
    description: "Training, spill kits, PPE, and safety data",
    types: [
      "Bloodborne Pathogens Training",
      "PPE Training Certificate",
      "Spill Kit Inspection Record",
      "SDS On Board"
    ]
  },
  {
    id: "licensing-registration",
    name: "Licensing & Registration", 
    icon: "📑",
    color: "bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold border-0",
    description: "Permits to operate and certifications",
    types: [
      "Commercial License",
      "Registration",
      "Tank Leakproof Certification"
    ]
  },
  {
    id: "insurance-inspection",
    name: "Insurance & Inspection",
    icon: "📋", 
    color: "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0",
    description: "Coverage and routine checks",
    types: [
      "Insurance",
      "Inspection"
    ]
  }
];

export const DocumentTypeManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<DocumentTypeFormData>({
    name: "",
    description: "",
    category: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allDocumentTypes, isLoading } = useQuery({
    queryKey: ["compliance-document-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_document_types")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DocumentTypeFormData) => {
      const { error } = await supabase
        .from("compliance_document_types")
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-document-types"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Custom document type created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create document type.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DocumentTypeFormData }) => {
      const { error } = await supabase
        .from("compliance_document_types")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-document-types"] });
      setIsDialogOpen(false);
      setEditingType(null);
      resetForm();
      toast({
        title: "Success",
        description: "Custom document type updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document type.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("compliance_document_types")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-document-types"] });
      toast({
        title: "Success",
        description: "Custom document type deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document type.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: ""
    });
  };

  const handleEdit = (docType: DocumentType) => {
    setEditingType(docType);
    setFormData({
      name: docType.name,
      description: docType.description || "",
      category: docType.category || ""
    });
    setIsDialogOpen(true);
  };

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
    
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Document Types</h3>
          <p className="text-sm text-gray-600">Manage document types organized by predefined categories</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingType(null);
                resetForm();
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Document Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Edit Document Type" : "Add New Document Type"}
              </DialogTitle>
            </DialogHeader>
            
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
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingType ? "Update" : "Create"} Type
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories with both predefined and custom types */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {predefinedCategories.map((category) => {
            // Get custom types for this category  
            const customTypesForCategory = allDocumentTypes?.filter(type => 
              (type as any).category === category.id
            ) || [];
            
            // Combine predefined and custom types
            const predefinedTypes: TypeDisplayItem[] = category.types.map(typeName => ({
              name: typeName,
              isPredefined: true
            }));
            
            const customTypes: TypeDisplayItem[] = customTypesForCategory.map(type => ({
              ...type,
              isPredefined: false
            }));
            
            const allTypesForCategory = [...predefinedTypes, ...customTypes];

            return (
              <Card key={category.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{category.icon}</div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{category.name}</h5>
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    <Badge className={category.color}>
                      {allTypesForCategory.length} types
                    </Badge>
                    <div className="mt-3 space-y-1">
                      {allTypesForCategory.map((type, index) => (
                        <div key={index} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <FileText className="w-3 h-3" />
                            <span>{type.name}</span>
                            {!type.isPredefined && (
                              <Badge variant="outline" className="text-xs px-1 py-0">Custom</Badge>
                            )}
                          </div>
                          
                           {!type.isPredefined && type.id && (
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                 onClick={() => handleEdit({
                                   id: type.id!,
                                   name: type.name,
                                   description: type.description || null,
                                   default_reminder_days: type.default_reminder_days || 30,
                                   is_active: type.is_active || true,
                                   category: type.category
                                 })}
                               >
                                 <Edit className="w-3 h-3" />
                               </Button>
                               
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                   >
                                     <Trash2 className="w-3 h-3" />
                                   </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                   <AlertDialogHeader>
                                     <AlertDialogTitle>Delete Document Type</AlertDialogTitle>
                                     <AlertDialogDescription>
                                       Are you sure you want to delete "{type.name}"? This action cannot be undone.
                                     </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                     <AlertDialogCancel>Cancel</AlertDialogCancel>
                                     <AlertDialogAction
                                       onClick={() => deleteMutation.mutate(type.id!)}
                                       className="bg-red-600 hover:bg-red-700"
                                     >
                                       Delete
                                     </AlertDialogAction>
                                   </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};