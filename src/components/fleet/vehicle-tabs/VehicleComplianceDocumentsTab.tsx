import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface VehicleComplianceDocumentsTabProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleComplianceDocumentsTab({ vehicleId, licensePlate }: VehicleComplianceDocumentsTabProps) {
  const navigate = useNavigate();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['vehicle-compliance-documents', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_compliance_documents')
        .select(`
          *,
          compliance_document_types(name)
        `)
        .eq('vehicle_id', vehicleId)
        .order('expiration_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const getExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) return 'unknown';
    
    const expiry = new Date(expirationDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'critical';
    if (diffDays <= 30) return 'warning';
    return 'valid';
  };

  const getStatusBadge = (status: string, expirationDate: string | null) => {
    const statusInfo = {
      expired: { label: 'Expired', className: 'bg-gradient-to-r from-red-500 to-red-600 text-white font-bold' },
      critical: { label: 'Expires Soon', className: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold' },
      warning: { label: 'Expiring', className: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold' },
      valid: { label: 'Valid', className: 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold' },
      unknown: { label: 'No Expiration', className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold' },
    };

    const info = statusInfo[status as keyof typeof statusInfo] || statusInfo.unknown;
    
    return (
      <Badge className={info.className}>
        {info.label}
      </Badge>
    );
  };

  const formatDaysRemaining = (expirationDate: string | null) => {
    if (!expirationDate) return 'No expiration date';
    
    const expiry = new Date(expirationDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `${diffDays} days remaining`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Compliance Documents</h3>
          <p className="text-sm text-gray-600">DOT/FMCSA, permits, and certifications for {licensePlate}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/fleet/compliance?tab=documents&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          className="gap-2"
        >
          View All <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {documents && documents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">No compliance documents found for this vehicle</p>
            <Button
              onClick={() => navigate(`/fleet/compliance?tab=documents&vehicle=${vehicleId}&action=add&returnTo=/fleet-management`)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
            >
              Add First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents?.map((doc) => {
            const status = getExpirationStatus(doc.expiration_date);
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {doc.compliance_document_types?.name || 'Unknown Type'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                          {doc.expiration_date && (
                            <>
                              <span>Expires: {format(new Date(doc.expiration_date), 'MMM dd, yyyy')}</span>
                              <span>•</span>
                              <span className={status === 'expired' || status === 'critical' ? 'text-red-600 font-medium' : ''}>
                                {formatDaysRemaining(doc.expiration_date)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(status, doc.expiration_date)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
