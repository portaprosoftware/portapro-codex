import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Truck, Plus, FileText, Calendar, AlertTriangle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { VehicleSelector } from "../VehicleSelector";

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  vehicle_type: string;
  year?: number;
  status: string;
}

interface ComplianceDocument {
  id: string;
  vehicle_id: string;
  document_type_id: string;
  expiration_date: string | null;
  created_at: string;
  compliance_document_types: {
    name: string;
  };
}

export const VehicleManagementTab: React.FC = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model, vehicle_type, year, status")
        .eq("status", "active")
        .order("license_plate");
      
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const { data: complianceDocuments } = useQuery({
    queryKey: ["vehicle-compliance-documents", selectedVehicleId],
    queryFn: async () => {
      if (!selectedVehicleId) return [];
      
      const { data, error } = await supabase
        .from("vehicle_compliance_documents")
        .select(`
          *,
          compliance_document_types(name)
        `)
        .eq("vehicle_id", selectedVehicleId)
        .order("expiration_date", { ascending: true });
      
      if (error) throw error;
      return data as ComplianceDocument[];
    },
    enabled: !!selectedVehicleId,
  });

  const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId);

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

  const getComplianceStats = () => {
    if (!complianceDocuments) return { total: 0, overdue: 0, critical: 0, warning: 0, good: 0 };
    
    const stats = {
      total: complianceDocuments.length,
      overdue: 0,
      critical: 0,
      warning: 0,
      good: 0
    };

    complianceDocuments.forEach(doc => {
      const urgency = getUrgencyLevel(doc.expiration_date);
      stats[urgency as keyof typeof stats]++;
    });

    return stats;
  };

  const stats = getComplianceStats();

  if (vehiclesLoading) {
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
          <h3 className="text-lg font-semibold text-gray-900">Vehicle Management</h3>
          <p className="text-sm text-gray-600">Select a vehicle to view and manage compliance documents</p>
        </div>
      </div>

      {/* Vehicle Selection */}
      <VehicleSelector
        selectedVehicleId={selectedVehicleId}
        onVehicleSelect={setSelectedVehicleId}
      />

      {/* Vehicle Details & Documents */}
      {selectedVehicle && (
        <div className="space-y-6">
          {/* Compliance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 border-0 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Total Documents</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <FileText className="w-6 h-6 text-white" />
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-r from-red-500 to-red-600 border-0 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Overdue</p>
                  <p className="text-2xl font-bold text-white">{stats.overdue}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 border-0 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Critical</p>
                  <p className="text-2xl font-bold text-white">{stats.critical}</p>
                </div>
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 border-0 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Warning</p>
                  <p className="text-2xl font-bold text-white">{stats.warning}</p>
                </div>
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-r from-green-500 to-green-600 border-0 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Good</p>
                  <p className="text-2xl font-bold text-white">{stats.good}</p>
                </div>
                <FileText className="w-6 h-6 text-white" />
              </div>
            </Card>
          </div>

          {/* Documents List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Compliance Documents for {selectedVehicle.license_plate}
              </h4>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </div>

            {complianceDocuments && complianceDocuments.length > 0 ? (
              <div className="space-y-3">
                {complianceDocuments.map((document) => {
                  const urgency = getUrgencyLevel(document.expiration_date);
                  return (
                    <Card key={document.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {document.compliance_document_types?.name}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {document.expiration_date 
                                ? `Expires: ${new Date(document.expiration_date).toLocaleDateString()}`
                                : "No expiration date"
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={cn(getUrgencyColor(urgency))}>
                            {formatDaysRemaining(document.expiration_date)}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No compliance documents</h3>
                <p className="text-gray-600 mb-4">This vehicle doesn't have any compliance documents yet.</p>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Document
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};