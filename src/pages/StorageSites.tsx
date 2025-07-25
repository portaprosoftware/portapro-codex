import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddStorageSiteModal } from "@/components/inventory/AddStorageSiteModal";
import { EditStorageSiteModal } from "@/components/inventory/EditStorageSiteModal";
import { Plus, MapPin, Edit, Trash2, Building } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

interface StorageLocation {
  id: string;
  name: string;
  description?: string;
  address_type: 'company_address' | 'custom' | 'gps';
  custom_street?: string;
  custom_street2?: string;
  custom_city?: string;
  custom_state?: string;
  custom_zip?: string;
  gps_coordinates?: { x: number; y: number };
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export default function StorageSites() {
  const { hasAdminAccess } = useUserRole();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<StorageLocation | null>(null);

  if (!hasAdminAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: storageLocations, isLoading } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data as StorageLocation[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('storage_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      toast.success("Storage site deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete storage site: " + error.message);
    }
  });

  const formatAddress = (site: StorageLocation) => {
    if (site.address_type === 'company_address') {
      return "Company Address";
    } else if (site.address_type === 'gps') {
      return site.gps_coordinates 
        ? `GPS: ${site.gps_coordinates.y.toFixed(6)}, ${site.gps_coordinates.x.toFixed(6)}`
        : "GPS Coordinates";
    } else {
      const parts = [
        site.custom_street,
        site.custom_street2,
        site.custom_city,
        site.custom_state,
        site.custom_zip
      ].filter(Boolean);
      return parts.join(', ') || 'Custom Address';
    }
  };

  const handleDelete = (site: StorageLocation) => {
    if (site.is_default) {
      toast.error("Cannot delete the default storage location");
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${site.name}"?`)) {
      deleteMutation.mutate(site.id);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Storage Sites"
        subtitle="Manage your company's storage locations and warehouses"
      >
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Storage Site
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4 w-3/4"></div>
                <div className="h-3 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {storageLocations?.map((site) => (
            <Card key={site.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{site.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    {site.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                    {!site.is_active && (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {site.description}
                </div>
                
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {formatAddress(site)}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSite(site)}
                    className="gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  {!site.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(site)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {storageLocations?.length === 0 && !isLoading && (
        <Card className="p-8 text-center">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Storage Sites</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first storage location
          </p>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Storage Site
          </Button>
        </Card>
      )}

      <AddStorageSiteModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {editingSite && (
        <EditStorageSiteModal
          site={editingSite}
          open={true}
          onOpenChange={(open) => !open && setEditingSite(null)}
          onClose={() => setEditingSite(null)}
        />
      )}
    </div>
  );
}