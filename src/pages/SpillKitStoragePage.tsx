import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { SpillKitStorageNavigation } from "@/components/fleet/compliance/SpillKitStorageNavigation";
import { AddSpillKitStorageLocationModal } from "@/components/fleet/compliance/AddSpillKitStorageLocationModal";
import { SpillKitLocationStockManager } from "@/components/fleet/compliance/SpillKitLocationStockManager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreVertical, Edit, Trash2, Warehouse, Truck, Building2, MapPin, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "react-router-dom";

export default function SpillKitStoragePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [deletingLocation, setDeletingLocation] = useState<any>(null);

  const showStockView = location.hash === "#stock";

  useEffect(() => {
    document.title = "Spill Kit Storage Locations | PortaPro";
  }, []);

  const { data: locations, isLoading } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('*, vehicles(license_plate)')
        .order('name');
      if (error) throw error;
      return data;
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
      toast({
        title: "Success",
        description: "Location deleted successfully"
      });
      setDeletingLocation(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse': return <Warehouse className="h-4 w-4" />;
      case 'vehicle': return <Truck className="h-4 w-4" />;
      case 'facility': return <Building2 className="h-4 w-4" />;
      case 'mobile': return <MapPin className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatAddress = (location: any) => {
    if (location.address_type === 'company') return 'Company Address';
    if (location.address_type === 'gps' && location.address_gps_lat && location.address_gps_lng) {
      return `${location.address_gps_lat}, ${location.address_gps_lng}`;
    }
    return location.address_custom || 'No address';
  };

  return (
    <FleetLayout>
      <div className="space-y-6">
        <SpillKitStorageNavigation onAddStorage={() => setAddModalOpen(true)} />

        {showStockView ? (
          <SpillKitLocationStockManager />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : locations && locations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location: any) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getLocationIcon(location.location_type)}
                          {location.name}
                          {location.is_default && (
                            <Badge variant="secondary" className="ml-2">Default</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {location.location_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatAddress(location)}
                        {location.vehicles && (
                          <span className="block text-xs">Vehicle: {location.vehicles.license_plate}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.is_active ? "success" : "secondary"}>
                          {location.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingLocation(location);
                              setAddModalOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDeletingLocation(location)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Storage Locations</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first storage location to start tracking spill kit inventory.
                </p>
                <Button onClick={() => setAddModalOpen(true)}>
                  Add Storage Location
                </Button>
              </div>
            )}
          </div>
        )}

        <AddSpillKitStorageLocationModal
          open={addModalOpen}
          onOpenChange={(open) => {
            setAddModalOpen(open);
            if (!open) setEditingLocation(null);
          }}
          location={editingLocation}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['spill_kit_storage_locations'] });
            setEditingLocation(null);
          }}
        />

        <AlertDialog open={!!deletingLocation} onOpenChange={() => setDeletingLocation(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Storage Location</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingLocation?.name}"? This action cannot be undone.
                All stock at this location will be unassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deletingLocation.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </FleetLayout>
  );
}
