import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StorageSitesLayout } from "@/components/inventory/StorageSitesLayout";
import { StorageSitesNavigation } from "@/components/inventory/StorageSitesNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AddStorageSiteModal } from "@/components/inventory/AddStorageSiteModal";
import { EditStorageSiteModal } from "@/components/inventory/EditStorageSiteModal";
import { StorageLocationReporting } from "@/components/inventory/StorageLocationReporting";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Plus, MapPin, Edit, Trash2, Warehouse, BarChart3, MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useLocation } from "react-router-dom";

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
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<StorageLocation | null>(null);
  const [selectedSiteForActions, setSelectedSiteForActions] = useState<StorageLocation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    document.title = 'Storage Sites | PortaPro';
  }, []);

  if (!hasAdminAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const activeTab = location.hash === "#reporting" ? "reporting" : "locations";

  const { data: storageLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('*');
      
      if (error) throw error;
      
      // Sort with default location at top, then alphabetically
      const sortedData = (data as StorageLocation[]).sort((a, b) => {
        // Default location always first
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        
        // If both or neither are default, sort alphabetically
        return a.name.localeCompare(b.name);
      });
      
      return sortedData;
    }
  });

  const { data: companySettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  // Combined loading state - wait for both queries
  const isLoading = locationsLoading || settingsLoading;

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
      return {
        label: "Main Company Address",
        address: companySettings ? [
          companySettings.company_street,
          companySettings.company_street2,
          companySettings.company_city,
          companySettings.company_state,
          companySettings.company_zipcode
        ].filter(Boolean).join(', ') : 'Loading address...'
      };
    } else if (site.address_type === 'gps') {
      return {
        label: "GPS Coordinates",
        address: site.gps_coordinates 
          ? `${site.gps_coordinates.y.toFixed(6)}, ${site.gps_coordinates.x.toFixed(6)}`
          : "GPS coordinates not set"
      };
    } else {
      const parts = [
        site.custom_street,
        site.custom_street2,
        site.custom_city,
        site.custom_state,
        site.custom_zip
      ].filter(Boolean);
      return {
        label: "Custom Address",
        address: parts.length > 0 ? parts.join(', ') : 'Custom address not set'
      };
    }
  };

  const handleDelete = (site: StorageLocation) => {
    if (site.is_default) {
      toast.error("Cannot delete the default storage location");
      return;
    }
    
    deleteMutation.mutate(site.id);
  };

  return (
    <StorageSitesLayout onAddStorage={() => setShowAddModal(true)}>
      <div className="space-y-6">
        {activeTab === "locations" ? (
          <>
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Table View */}
                <Card className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storageLocations?.map((site) => {
                        const addressInfo = formatAddress(site);
                        
                        return (
                          <TableRow key={site.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Warehouse className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{site.name}</div>
                                  {site.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {site.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <div className="font-medium text-muted-foreground">
                                    {addressInfo.label}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {addressInfo.address}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {site.is_active ? (
                                  <Badge variant="active">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="inactive">
                                    Inactive
                                  </Badge>
                                )}
                                {site.is_default && (
                                  <Badge variant="secondary">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <span className="sr-only">Open menu for {site.name}</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-background border z-50">
                                  <DropdownMenuItem onClick={() => setEditingSite(site)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  {!site.is_default && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedSiteForActions(site);
                                        setShowDeleteDialog(true);
                                      }}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {storageLocations?.map((site) => {
                    const addressInfo = formatAddress(site);
                    
                    return (
                      <Card key={site.id} className="p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Garage Name */}
                            <div className="flex items-center gap-2 mb-2">
                              <Warehouse className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <h3 className="font-semibold text-base truncate">{site.name}</h3>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-2 mb-3">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-muted-foreground">
                                <div className="font-medium">{addressInfo.label}</div>
                                <div className="line-clamp-2">{addressInfo.address}</div>
                              </div>
                            </div>

                            {/* Status and Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              {site.is_active ? (
                                <Badge variant="active" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="inactive" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Inactive
                                </Badge>
                              )}
                              {site.is_default && (
                                <Badge variant="secondary">
                                  Default
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions Button */}
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="flex-shrink-0 h-10 w-10"
                                onClick={() => setSelectedSiteForActions(site)}
                              >
                                <span className="sr-only">Open actions for {site.name}</span>
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="rounded-t-2xl">
                              <SheetHeader>
                                <SheetTitle className="text-left">
                                  {site.name}
                                </SheetTitle>
                              </SheetHeader>
                              <div className="mt-6 space-y-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start h-12 text-base"
                                  onClick={() => {
                                    setEditingSite(site);
                                  }}
                                >
                                  <Edit className="h-5 w-5 mr-3" />
                                  Edit Garage
                                </Button>
                                
                                {!site.is_default && (
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start h-12 text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setShowDeleteDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-5 w-5 mr-3" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {storageLocations?.length === 0 && !isLoading && (
              <Card className="p-8 text-center">
                <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Storage Sites</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first storage location
                </p>
                <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-blue-700 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Storage Site
                </Button>
              </Card>
            )}
          </>
        ) : (
          <StorageLocationReporting />
        )}
      </div>

      {/* Floating Action Button - Mobile Only */}
      <FloatingActionButton
        icon={Plus}
        onClick={() => setShowAddModal(true)}
        className="lg:hidden"
        variant="primary"
        tooltip="Add Storage Garage"
      />

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Storage Site</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSiteForActions?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSiteForActions(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedSiteForActions) {
                  handleDelete(selectedSiteForActions);
                  setShowDeleteDialog(false);
                  setSelectedSiteForActions(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StorageSitesLayout>
  );
}