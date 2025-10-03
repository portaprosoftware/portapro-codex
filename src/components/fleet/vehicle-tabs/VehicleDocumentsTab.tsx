import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVehicleDocuments } from '@/hooks/vehicle/useVehicleDocuments';
import { FileText, Plus, ExternalLink, Download, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface VehicleDocumentsTabProps {
  vehicleId: string;
  licensePlate: string;
  onAddDocument?: () => void;
  isActive?: boolean;
}

export function VehicleDocumentsTab({ 
  vehicleId, 
  licensePlate,
  onAddDocument,
  isActive = true
}: VehicleDocumentsTabProps) {
  const navigate = useNavigate();
  const { data: documents, isLoading } = useVehicleDocuments({
    vehicleId,
    limit: 20,
    enabled: isActive,
  });

  const getExpirationBadge = (expirationDate: string | null) => {
    if (!expirationDate) return null;

    const daysUntilExpiration = differenceInDays(new Date(expirationDate), new Date());

    if (daysUntilExpiration < 0) {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold">
          EXPIRED
        </Badge>
      );
    } else if (daysUntilExpiration <= 30) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold">
          EXPIRES SOON
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
          VALID
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Compliance Documents ({documents?.total || 0})
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={onAddDocument}>
              <Plus className="w-4 h-4 mr-1" />
              Add Document
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/fleet/compliance?tab=documents&vehicle_id=${vehicleId}&vehicle_name=${encodeURIComponent(licensePlate)}`)}
              title="View all documents"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : documents && documents.items.length > 0 ? (
            <div className="space-y-3">
              {documents.items.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <p className="font-medium text-sm">{doc.document_type || 'Document'}</p>
                      {getExpirationBadge(doc.expiration_date)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Uploaded: {format(new Date(doc.uploaded_at || doc.created_at), 'MMM d, yyyy')}
                      </span>
                      {doc.expiration_date && (
                        <span>
                          Expires: {format(new Date(doc.expiration_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    {doc.document_number && (
                      <p className="text-xs text-muted-foreground mt-1">
                        #{doc.document_number}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No documents uploaded</p>
              <Button size="sm" onClick={onAddDocument}>
                <Plus className="w-4 h-4 mr-1" />
                Upload First Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
