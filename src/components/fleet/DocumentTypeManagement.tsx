import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  default_reminder_days: number;
  is_active: boolean;
}

interface DocumentTypeFormData {
  name: string;
  description: string;
  default_reminder_days: number;
}

export const DocumentTypeManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<DocumentTypeFormData>({
    name: "",
    description: "",
    default_reminder_days: 30
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documentTypes, isLoading } = useQuery({
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
        description: "Document type created successfully.",
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
        description: "Document type updated successfully.",
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
        description: "Document type deleted successfully.",
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
      default_reminder_days: 30
    });
  };

  const handleEdit = (docType: DocumentType) => {
    setEditingType(docType);
    setFormData({
      name: docType.name,
      description: docType.description || "",
      default_reminder_days: docType.default_reminder_days
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
          <p className="text-sm text-gray-600">Manage compliance document types and their settings</p>
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
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Edit Document Type" : "Add Document Type"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Insurance, Registration"
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
              
              <div>
                <Label htmlFor="reminder_days">Default Reminder Days *</Label>
                <Input
                  id="reminder_days"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.default_reminder_days}
                  onChange={(e) => setFormData({ ...formData, default_reminder_days: parseInt(e.target.value) || 30 })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Days before expiration to show warnings
                </p>
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

      <div className="grid gap-4">
        {documentTypes?.map((docType) => (
          <Card key={docType.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-gray-900">{docType.name}</h4>
                  <Badge variant={docType.is_active ? "default" : "secondary"}>
                    {docType.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {docType.description && (
                  <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Default reminder: {docType.default_reminder_days} days before expiration
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(docType)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Document Type</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{docType.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(docType.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
        
        {documentTypes?.length === 0 && (
          <Card className="p-8 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No document types found</h3>
            <p className="text-gray-600 mb-4">Create your first document type to start managing compliance.</p>
          </Card>
        )}
      </div>
    </div>
  );
};