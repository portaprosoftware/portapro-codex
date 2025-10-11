import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Plus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentUploadModal } from '@/components/fleet/DocumentUploadModal';
import type { VehicleSummaryData } from '@/hooks/vehicle/useVehicleSummary';

interface VehicleDocumentsSummaryProps {
  summary: VehicleSummaryData['documents'] | undefined;
  vehicleId: string;
  licensePlate: string;
}

export function VehicleDocumentsSummary({ 
  summary, 
  vehicleId, 
  licensePlate 
}: VehicleDocumentsSummaryProps) {
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Fetch vehicles for the upload modal
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-upload'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type, make, model, year, status, vehicle_image, nickname');
      if (error) throw error;
      return data;
    }
  });

  // Fetch categories for the upload modal
  const { data: categories } = useQuery({
    queryKey: ['document-categories-for-upload'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Documents:</span>
            <span className="font-semibold">{summary?.total_count ?? 0}</span>
          </div>

          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Expiring Soon:</span>
            <div className="flex items-center gap-2">
              {(summary?.expiring_soon ?? 0) > 0 && (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              )}
              <span className={`font-semibold ${(summary?.expiring_soon ?? 0) > 0 ? 'text-orange-600' : ''}`}>
                {summary?.expiring_soon ?? 0}
              </span>
            </div>
          </div>

          {summary?.total_count === 0 && (
            <p className="text-sm text-muted-foreground pt-2">
              No documents uploaded yet for {licensePlate}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/files?vehicle=${vehicleId}&returnTo=/fleet-management`)}
          >
            Manage Docs <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" /> Upload
          </Button>
        </div>

        {/* Upload Modal */}
        {vehicles && categories && (
          <DocumentUploadModal
            vehicles={vehicles}
            categories={categories}
            defaultVehicleId={vehicleId}
            open={isUploadModalOpen}
            onOpenChange={setIsUploadModalOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}
