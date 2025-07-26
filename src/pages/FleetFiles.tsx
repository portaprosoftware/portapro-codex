import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Upload, FolderOpen, Filter, Grid3X3, List, Settings } from "lucide-react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { DocumentCard } from "@/components/fleet/DocumentCard";
import { DocumentUploadModal } from "@/components/fleet/DocumentUploadModal";
import { DocumentCategoryManagement } from "@/components/fleet/DocumentCategoryManagement";
import { useToast } from "@/hooks/use-toast";

export default function FleetFiles() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const { toast } = useToast();

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model")
        .order("license_plate");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch document categories
  const { data: categories } = useQuery({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("name, icon, color, description")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch documents with vehicle info
  const { data: documents, isLoading } = useQuery({
    queryKey: ["vehicle-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_documents")
        .select(`
          *,
          vehicles!inner (
            license_plate,
            make,
            model
          )
        `)
        .order("upload_date", { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(doc => ({
        ...doc,
        vehicle_name: `${doc.vehicles?.make || ''} ${doc.vehicles?.model || ''}`.trim() || 'Unknown Vehicle',
        vehicle_plate: doc.vehicles?.license_plate || 'Unknown'
      }));
    },
  });

  // Filter documents based on current filters
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    
    return documents.filter(doc => {
      const vehicleMatch = selectedVehicle === "all" || doc.vehicle_id === selectedVehicle;
      const categoryMatch = selectedCategory === "all" || doc.category === selectedCategory;
      const searchMatch = searchQuery === "" || 
        doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.document_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.vehicle_plate.toLowerCase().includes(searchQuery.toLowerCase());
      
      return vehicleMatch && categoryMatch && searchMatch;
    });
  }, [documents, selectedVehicle, selectedCategory, searchQuery]);

  // Group documents by category for tabs
  const documentsByCategory = useMemo(() => {
    const grouped = filteredDocuments.reduce((acc, doc) => {
      const category = doc.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, typeof filteredDocuments>);
    
    return grouped;
  }, [filteredDocuments]);

  // Get category info for a document
  const getCategoryInfo = (categoryName: string) => {
    return categories?.find(cat => cat.name === categoryName) || {
      name: categoryName,
      icon: 'File',
      color: '#6B7280',
      description: 'Document'
    };
  };

  const handleView = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('vehicle-documents')
        .createSignedUrl(document.file_path, 60); // 1 hour expiry
      
      if (error) throw error;
      
      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast({
        title: "View Failed",
        description: "Could not open the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('vehicle-documents')
        .download(document.file_path);
      
      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `${document.file_name} has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (document: any) => {
    setDocumentToDelete(document);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      // Delete from storage
      if (documentToDelete.file_path) {
        await supabase.storage
          .from('vehicle-documents')
          .remove([documentToDelete.file_path]);
      }
      
      // Delete from database
      const { error } = await supabase
        .from('vehicle_documents')
        .delete()
        .eq('id', documentToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
      
      setDocumentToDelete(null);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <FleetSidebar />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Enhanced Header */}
        <div className="border-b bg-card p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-inter">
                Documents & Photos
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage receipts, warranties, photos, and vehicle paperwork
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <DocumentUploadModal 
                vehicles={vehicles || []}
                categories={categories || []}
                trigger={
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                }
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search documents, file names, document numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Vehicle Filter */}
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Document Categories Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <div className="border-b px-6">
              <TabsList className="grid grid-cols-6 lg:grid-cols-9 w-full max-w-5xl">
                <TabsTrigger value="all" className="text-xs">
                  All ({filteredDocuments.length})
                </TabsTrigger>
                <TabsTrigger value="receipt" className="text-xs">
                  Receipts ({documentsByCategory.receipt?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="warranty" className="text-xs">
                  Warranties ({documentsByCategory.warranty?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="photo" className="text-xs">
                  Photos ({documentsByCategory.photo?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="other" className="text-xs">
                  Other ({documentsByCategory.other?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="categories" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  Categories
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* All Documents */}
              <TabsContent value="all" className="mt-0">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading documents...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No documents found matching your criteria.</p>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${
                    viewMode === "grid" 
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                      : "grid-cols-1"
                  }`}>
                    {filteredDocuments.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        categoryInfo={getCategoryInfo(doc.category)}
                        onView={handleView}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Category-specific tabs */}
              {categories?.map((category) => (
                <TabsContent key={category.name} value={category.name} className="mt-0">
                  <div className={`grid gap-4 ${
                    viewMode === "grid" 
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                      : "grid-cols-1"
                  }`}>
                    {(documentsByCategory[category.name] || []).map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        categoryInfo={category}
                        onView={handleView}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}

              {/* Categories Management Tab */}
              <TabsContent value="categories" className="mt-0">
                <DocumentCategoryManagement />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document 
              "{documentToDelete?.document_name}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}