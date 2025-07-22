import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Eye, Trash2 } from "lucide-react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";

interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

export default function FleetFiles() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model")
        .order("license_plate");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Mock document data since we don't have actual file storage setup
  const mockDocuments = [
    {
      id: "1",
      vehicle_id: "OH-USHG-02",
      vehicle_name: "2021 Kenworth T370",
      document_type: "Maintenance Receipt",
      category: "Maintenance",
      file_name: "Maintenance_Freightliner_M2_106.pdf",
      file_size: "0.0 MB",
      document_number: "Main-2232"
    },
    {
      id: "2", 
      vehicle_id: "OH-BSJT-01",
      vehicle_name: "2020 Freightliner M2 106",
      document_type: "Warranty",
      category: "Warranty",
      file_name: "Warranty_Freightliner_M2_106.pdf",
      file_size: "0.0 MB",
      document_number: null
    },
    {
      id: "3",
      vehicle_id: "OH-BSJT-01", 
      vehicle_name: "2020 Freightliner M2 106",
      document_type: "Maintenance Receipt",
      category: "Maintenance", 
      file_name: "Maintenance_Freightliner_M2_106.pdf",
      file_size: "0.0 MB",
      document_number: null
    }
  ];

  const documentTypes = ["Maintenance Receipt", "Warranty", "Insurance", "Registration", "Inspection"];

  const filteredDocuments = mockDocuments.filter(doc => {
    const vehicleMatch = selectedVehicle === "all" || doc.vehicle_id === selectedVehicle;
    const typeMatch = selectedType === "all" || doc.document_type === selectedType;
    return vehicleMatch && typeMatch;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <FleetSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Documents</h1>
              <p className="text-gray-600">Manage insurance, registration, and other vehicle documents</p>
            </div>
            
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.license_plate}>
                    {vehicle.license_plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Document Icon & Type */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <Badge variant="secondary" className="text-xs">
                        {doc.document_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Document Details */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">{doc.category}</h3>
                    <div className="text-sm text-gray-600">
                      <div>{doc.vehicle_id}</div>
                      <div>{doc.vehicle_name}</div>
                    </div>
                    
                    {doc.document_number && (
                      <div className="text-sm">
                        <span className="text-gray-500">Document Number</span>
                        <div className="font-medium">{doc.document_number}</div>
                      </div>
                    )}
                    
                    <div className="text-sm">
                      <span className="text-gray-500">File</span>
                      <div className="font-medium">{doc.file_name}</div>
                      <div className="text-gray-500">{doc.file_size}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}