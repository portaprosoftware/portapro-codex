
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceDocument {
  id: string;
  vehicle_id: string;
  document_type_id: string;
  expiration_date: string | null;
  vehicle: {
    license_plate: string;
    vehicle_type: string;
  };
  compliance_document_types: {
    name: string;
  };
}

export const FleetCompliance: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <FleetComplianceContent />
    </div>
  );
};

const FleetComplianceContent: React.FC = () => {
  const { data: documents, isLoading } = useQuery({
    queryKey: ["vehicle-compliance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_compliance_documents")
        .select(`
          *,
          vehicles(license_plate, vehicle_type),
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

  const overdueCount = documents?.filter(doc => getUrgencyLevel(doc.expiration_date) === "overdue").length || 0;
  const criticalCount = documents?.filter(doc => getUrgencyLevel(doc.expiration_date) === "critical").length || 0;
  const warningCount = documents?.filter(doc => getUrgencyLevel(doc.expiration_date) === "warning").length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Overdue</p>
              <p className="text-2xl font-bold text-red-900">{overdueCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
        
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Critical (≤7 days)</p>
              <p className="text-2xl font-bold text-orange-900">{criticalCount}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
        
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Warning (≤30 days)</p>
              <p className="text-2xl font-bold text-amber-900">{warningCount}</p>
            </div>
            <FileText className="w-8 h-8 text-amber-600" />
          </div>
        </Card>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">All Compliance Documents</h3>
        
        {documents?.map((document) => {
          const urgency = getUrgencyLevel(document.expiration_date);
          return (
            <Card key={document.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {document.vehicles?.license_plate} - {document.compliance_document_types?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {document.vehicles?.vehicle_type} • Expires: {document.expiration_date ? new Date(document.expiration_date).toLocaleDateString() : "No date set"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={cn(getUrgencyColor(urgency))}>
                    {formatDaysRemaining(document.expiration_date)}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        
        {documents?.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No compliance documents found</h3>
            <p className="text-gray-600 mb-4">Start by adding compliance documents for your vehicles.</p>
            <Button>Add Document</Button>
          </Card>
        )}
      </div>
    </div>
  );
};
