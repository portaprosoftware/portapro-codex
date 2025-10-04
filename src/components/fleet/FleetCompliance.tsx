import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertTriangle, Calendar, FileText, Plus, Settings, Upload, Info, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DocumentTypeManagement } from "./DocumentTypeManagement";
import { AddDocumentForm } from "./AddDocumentForm";
import { UpdateDocumentModal } from "./UpdateDocumentModal";
import { SpillKitsTab } from "./compliance/SpillKitsTab";
import { SpillKitExpirationDashboard } from "./compliance/SpillKitExpirationDashboard";
import { IncidentRoleGateway } from "./compliance/IncidentRoleGateway";
import { DeconLogsTab } from "./compliance/DeconLogsTab";
import { ComplianceReporting } from "./ComplianceReporting";
import { VehicleManagementTab } from "./compliance/VehicleManagementTab";
import { ComplianceGuideContent } from "./compliance/ComplianceGuideContent";

interface ComplianceDocument {
  id: string;
  vehicle_id: string;
  document_type_id: string;
  expiration_date: string | null;
  vehicle: {
    license_plate: string;
    vehicle_type: string;
    make: string;
    model: string;
    nickname?: string;
  };
  compliance_document_types: {
    name: string;
  };
}

export const FleetCompliance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("documents");
  const [documentDrawerOpen, setDocumentDrawerOpen] = useState(false);

  // Set initial tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  const [documentTypeDrawerOpen, setDocumentTypeDrawerOpen] = useState(false);
  const [inspectionDrawerOpen, setInspectionDrawerOpen] = useState(false);
  const [incidentDrawerOpen, setIncidentDrawerOpen] = useState(false);
  const [deconDrawerOpen, setDeconDrawerOpen] = useState(false);

  // Dynamic header button based on active tab
  const renderHeaderAction = () => {
    switch (activeTab) {
      case "documents":
        return (
          <Button 
            onClick={() => setDocumentDrawerOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </Button>
        );
      case "spill-kits":
        return (
          <Button 
            onClick={() => setInspectionDrawerOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Inspection
          </Button>
        );
      case "incidents":
        return (
          <Button 
            onClick={() => setIncidentDrawerOpen(true)}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log New Incident
          </Button>
        );
      case "decon":
        return (
          <Button 
            onClick={() => setDeconDrawerOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Decon
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900 font-inter">Transport & Spill Compliance</h1>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="p-1 hover:bg-muted rounded-full transition-colors">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">How This Works</DialogTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        A quick guide to Transport & Spill Compliance features and roles
                      </p>
                    </DialogHeader>
                    <ComplianceGuideContent />
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-base text-gray-600 font-inter mt-1">DOT/FMCSA, state permits, spill readiness, and EPA/OSHA docs</p>
              <p className="text-sm text-gray-500 font-inter mt-1">Documents also accessible from each vehicle's details page</p>
            </div>
            {renderHeaderAction()}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white rounded-full p-1 shadow-sm border w-fit overflow-x-auto">
              <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Documents</TabsTrigger>
              <TabsTrigger value="spill-kits" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Spill Kits</TabsTrigger>
              <TabsTrigger value="incidents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Incidents</TabsTrigger>
              <TabsTrigger value="decon" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Decon Logs</TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Reports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents">
              <FleetComplianceContent 
                drawerOpen={documentDrawerOpen}
                setDrawerOpen={setDocumentDrawerOpen}
              />
            </TabsContent>

            <TabsContent value="spill-kits">
              <SpillKitsTab 
                inspectionDrawerOpen={inspectionDrawerOpen}
                setInspectionDrawerOpen={setInspectionDrawerOpen}
              />
            </TabsContent>

            <TabsContent value="incidents">
              <IncidentRoleGateway 
                drawerOpen={incidentDrawerOpen}
                setDrawerOpen={setIncidentDrawerOpen}
              />
            </TabsContent>

            <TabsContent value="decon">
              <DeconLogsTab 
                drawerOpen={deconDrawerOpen}
                setDrawerOpen={setDeconDrawerOpen}
              />
            </TabsContent>

            <TabsContent value="reports">
              <ComplianceReporting />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

interface FleetComplianceContentProps {
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
}

const FleetComplianceContent: React.FC<FleetComplianceContentProps> = ({
  drawerOpen: externalDrawerOpen,
  setDrawerOpen: externalSetDrawerOpen
}) => {
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  
  const addDocumentDrawerOpen = externalDrawerOpen ?? internalDrawerOpen;
  const setAddDocumentDrawerOpen = externalSetDrawerOpen ?? setInternalDrawerOpen;
  const [isUpdateDocumentModalOpen, setIsUpdateDocumentModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["vehicle-compliance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_compliance_documents")
        .select(`
          *,
          vehicles(license_plate, vehicle_type, make, model, nickname),
          compliance_document_types(name)
        `)
        .order("expiration_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const getUrgencyLevel = (expirationDate: string | null) => {
    if (!expirationDate) return "unknown";
    
    const expiry = new Date(expirationDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "critical";
    if (diffDays <= 30) return "warning";
    return "good";
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "overdue":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      case "critical":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "warning":
        return "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold border-0";
      case "good":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  const formatDaysRemaining = (expirationDate: string | null) => {
    if (!expirationDate) return "No expiration date";
    
    const expiry = new Date(expirationDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `${diffDays} days remaining`;
  };

  const handleUpdateDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsUpdateDocumentModalOpen(true);
  };

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("vehicle_compliance_documents")
        .delete()
        .eq("id", documentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-compliance"] });
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteDocument = (documentId: string) => {
    if (window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const closeUpdateModal = () => {
    setIsUpdateDocumentModalOpen(false);
    setSelectedDocumentId(null);
  };

  const getVehicleName = (vehicle: any) => {
    if (vehicle?.make && vehicle?.model) {
      return `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`;
    }
    return vehicle?.vehicle_type || 'Unknown Vehicle';
  };

  const overdueCount = documents?.filter((doc: any) => getUrgencyLevel(doc.expiration_date) === "overdue").length || 0;
  const criticalCount = documents?.filter((doc: any) => getUrgencyLevel(doc.expiration_date) === "critical").length || 0;
  const warningCount = documents?.filter((doc: any) => getUrgencyLevel(doc.expiration_date) === "warning").length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">All Compliance Documents</h3>
          <p className="text-sm text-gray-600">Track permits, certifications, and required paperwork</p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-r from-red-500 to-red-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Overdue</p>
              <p className="text-2xl font-bold text-white">{overdueCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Critical (≤7 days)</p>
              <p className="text-2xl font-bold text-white">{criticalCount}</p>
            </div>
            <Calendar className="w-8 h-8 text-white" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Warning (≤30 days)</p>
              <p className="text-2xl font-bold text-white">{warningCount}</p>
            </div>
            <FileText className="w-8 h-8 text-white" />
          </div>
        </Card>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        
        {documents?.map((document) => {
          const urgency = getUrgencyLevel(document.expiration_date);
          return (
            <Card key={document.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getVehicleName(document.vehicles)}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-600 font-medium">{document.vehicles?.license_plate}</span>
                      <span>•</span>
                      <span>{document.compliance_document_types?.name}</span>
                      <span>•</span>
                      <span>Expires: {document.expiration_date ? new Date(document.expiration_date).toLocaleDateString() : "No date set"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={cn(getUrgencyColor(urgency))}>
                    {formatDaysRemaining(document.expiration_date)}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpdateDocument(document.id)}
                  >
                    Update
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteDocument(document.id)}
                    className="text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:border-red-500 transition-all duration-200"
                    disabled={deleteDocumentMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        
        {documents?.length === 0 && (
          <Card className="p-8 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No compliance documents found</h3>
            <p className="text-gray-600 mb-4">Start by adding compliance documents for your vehicles.</p>
          </Card>
        )}
      </div>

      <Drawer open={addDocumentDrawerOpen} onOpenChange={setAddDocumentDrawerOpen}>
        <DrawerContent className="h-[75vh]">
          <DrawerHeader>
            <DrawerTitle>Add Compliance Document</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto flex-1">
            <AddDocumentForm 
              onSaved={() => setAddDocumentDrawerOpen(false)}
              onCancel={() => setAddDocumentDrawerOpen(false)} 
            />
          </div>
        </DrawerContent>
      </Drawer>

      <UpdateDocumentModal 
        isOpen={isUpdateDocumentModalOpen}
        onClose={closeUpdateModal}
        documentId={selectedDocumentId}
        onDelete={handleDeleteDocument}
      />
    </div>
  );
};
