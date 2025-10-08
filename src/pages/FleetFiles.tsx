import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Upload, FolderOpen, Settings, Truck, Filter, X } from "lucide-react";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { DocumentCard } from "@/components/fleet/DocumentCard";
import { DocumentListItem } from "@/components/fleet/DocumentListItem";
import { DocumentUploadModal } from "@/components/fleet/DocumentUploadModal";
import { DocumentViewModal } from "@/components/fleet/DocumentViewModal";
import { DocumentEditModal } from "@/components/fleet/DocumentEditModal";
import { DocumentCategoryManagement } from "@/components/fleet/DocumentCategoryManagement";
import { MultiSelectVehicleFilter } from "@/components/fleet/MultiSelectVehicleFilter";
import { MultiSelectCategoryFilter } from "@/components/fleet/MultiSelectCategoryFilter";
import { ExpiringDocumentsAlert } from "@/components/fleet/ExpiringDocumentsAlert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";

interface Vehicle {
  id: string;
  license_plate: string | null;
  vehicle_type?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  status?: string | null;
  vehicle_image?: string | null;
  nickname?: string | null;
}

export default function FleetFiles() {
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [documentToView, setDocumentToView] = useState<any>(null);
  const [documentToEdit, setDocumentToEdit] = useState<any>(null);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    document.title = "Fleet Documents & Photos | PortaPro";
  }, []);

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model, nickname")
        .order("license_plate");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch document categories with all fields
  const { data: categories } = useQuery({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("id, name, icon, color, description, requires_expiration, custom_fields_schema, reminder_days_before, parent_group")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch documents only (no join) and enrich locally
  const { data: documents, isLoading } = useQuery({
    queryKey: ["vehicle-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_documents")
        .select("*")
        .order("upload_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Enrich with vehicle info client-side to avoid brittle joins
  const enrichedDocuments = useMemo(() => {
    const vmap = new Map((vehicles || []).map((v: any) => [v.id, v]));
    return (documents || []).map((doc: any) => {
      const v = vmap.get(doc.vehicle_id);
      return {
        ...doc,
        vehicle_name: v ? `${v.make || ''} ${v.model || ''}`.trim() || 'Unknown Vehicle' : 'Unknown Vehicle',
        vehicle_plate: v?.license_plate || 'Unknown',
        vehicle_make: v?.make || '',
        vehicle_model: v?.model || '',
        vehicle_nickname: v?.nickname || '',
      };
    });
  }, [documents, vehicles]);

  // Filter documents based on current filters
  const filteredDocuments = useMemo(() => {
    if (!enrichedDocuments) return [] as any[];

    return enrichedDocuments.filter((doc: any) => {
      // Vehicle filter - if vehicles are selected, only show docs for those vehicles
      const vehicleMatch = selectedVehicles.length === 0 || 
        selectedVehicles.some(v => v.id === doc.vehicle_id);
      
      // Category filter - if categories are selected, only show docs in those categories
      const categoryFilterMatch = selectedCategoryFilters.length === 0 ||
        selectedCategoryFilters.includes(doc.category);
      
      const categoryMatch = selectedCategory === "all" || doc.category === selectedCategory;
      const searchMatch =
        searchQuery === "" ||
        doc.document_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.document_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase());

      return vehicleMatch && categoryFilterMatch && categoryMatch && searchMatch;
    });
  }, [enrichedDocuments, selectedVehicles, selectedCategoryFilters, selectedCategory, searchQuery]);

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

  const handleView = (document: any) => {
    setDocumentToView(document);
  };

  const handleEdit = (document: any) => {
    setDocumentToEdit(document);
  };

  const handleDownload = async (document: any) => {
    try {
      const token = await getToken();
      const { data, error } = await supabase.functions.invoke('fleet-docs', {
        body: {
          action: 'create_signed_url',
          payload: { path: document.file_path, expiresIn: 600 },
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error || !data?.success) throw new Error((data as any)?.error || (error as any)?.message || 'Failed to create signed URL');

      const signedUrl = (data as any).data.signedUrl as string;
      const a = window.document.createElement('a');
      a.href = signedUrl;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);

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
        const { error: storageError } = await supabase.storage
          .from('vehicle-documents')
          .remove([documentToDelete.file_path]);
        
        if (storageError) {
          console.error('Storage delete error:', storageError);
          // Continue with database deletion even if storage fails
        }
      }
      
      // Delete from database
      const { error } = await supabase
        .from('vehicle_documents')
        .delete()
        .eq('id', documentToDelete.id);
      
      if (error) throw error;
      
      // Invalidate query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["vehicle-documents"] });
      
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
      
      setDocumentToDelete(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <FleetLayout>
      {/* Enhanced Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-inter">
              Additional Documents & Photos
            </h1>
            <p className="text-muted-foreground mt-1">
              Keep all your miscellaneous documents and photos in one place — anything not directly linked to compliance, maintenance, or preventive tasks.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <DocumentUploadModal 
              vehicles={vehicles || []}
              categories={categories || []}
              trigger={
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              }
            />
          </div>
        </div>

        {/* Document Categories Navigation */}
        <div className="flex items-center mt-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white rounded-full p-1 shadow-sm border w-fit overflow-x-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">
                All Documents & Photos ({filteredDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="categories" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">
                <Settings className="w-3 h-3 mr-1" />
                Manage Subcategories
              </TabsTrigger>
            </TabsList>

            {/* Advanced Filters - Only show when not in Manage Subcategories */}
            {activeTab !== "categories" && (
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search documents, file names, document numbers"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Vehicle Filter Button */}
                <Button
                  variant="outline"
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Truck className="h-4 w-4" />
                  {selectedVehicles.length === 0 
                    ? "All Vehicles" 
                    : `${selectedVehicles.length} Vehicle${selectedVehicles.length > 1 ? 's' : ''}`
                  }
                </Button>

                {/* Category Filter Button */}
                <Button
                  variant="outline"
                  onClick={() => setIsCategoryFilterOpen(true)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Filter className="h-4 w-4" />
                  {selectedCategoryFilters.length === 0 
                    ? "All Categories" 
                    : `${selectedCategoryFilters.length} Categor${selectedCategoryFilters.length > 1 ? 'ies' : 'y'}`
                  }
                </Button>

                {/* Clear Categories Filter Button */}
                {selectedCategoryFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategoryFilters([])}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            )}

            {/* All Documents */}
            <TabsContent value="all" className="mt-6">
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
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <DocumentListItem
                      key={doc.id}
                      document={doc}
                      categoryInfo={getCategoryInfo(doc.category)}
                      onView={handleView}
                      onDownload={handleDownload}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Category-specific tabs */}
            {categories?.map((category) => (
              <TabsContent key={category.id || category.name} value={category.name} className="mt-6">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <TabsContent value="categories" className="mt-6">
              <DocumentCategoryManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Vehicle Multi-Select Modal */}
      <MultiSelectVehicleFilter
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedVehicles={selectedVehicles}
        onVehiclesChange={setSelectedVehicles}
      />

      {/* Category Multi-Select Modal */}
      <MultiSelectCategoryFilter
        open={isCategoryFilterOpen}
        onOpenChange={setIsCategoryFilterOpen}
        categories={categories || []}
        selectedCategories={selectedCategoryFilters}
        onSelectionChange={setSelectedCategoryFilters}
      />

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

      {/* Document View Modal */}
      {documentToView && (
        <DocumentViewModal
          isOpen={!!documentToView}
          onClose={() => setDocumentToView(null)}
          document={documentToView}
          categoryInfo={getCategoryInfo(documentToView.category)}
        />
      )}

      {/* Document Edit Modal */}
      {documentToEdit && (
        <DocumentEditModal
          isOpen={!!documentToEdit}
          onClose={() => setDocumentToEdit(null)}
          document={documentToEdit}
          vehicles={vehicles || []}
          categories={categories || []}
        />
      )}
    </FleetLayout>
  );
}