import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, parseISO, differenceInDays, startOfDay, endOfDay, isToday } from "date-fns";
import { CheckCircle, XCircle, Clock, AlertTriangle, CalendarIcon, Search, ChevronLeft, ChevronRight as ChevronRightIcon, Truck, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiSelectVehicleFilter } from "../MultiSelectVehicleFilter";
import { SpillKitInspectionDetailModal } from "./SpillKitInspectionDetailModal";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

type InspectionRecord = {
  id: string;
  vehicle_id: string;
  vehicle_name: string;
  license_plate: string;
  has_kit: boolean;
  item_conditions: any;
  created_at: string;
  performed_by: string;
};

export function SpillKitInspectionHistory() {
  const [selectedVehicles, setSelectedVehicles] = useState<any[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const rowsPerPage = 25;
  
  const { hasAdminAccess, userId } = useUserRole();
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Permission checks
  const canEdit = (inspection: InspectionRecord) => {
    if (hasAdminAccess) return true;
    if (!userId) return false;
    
    const createdDate = startOfDay(parseISO(inspection.created_at));
    const today = startOfDay(new Date());
    const isSameDay = createdDate.getTime() === today.getTime();
    const isOwnInspection = inspection.performed_by === userId; // This should check clerk_user_id
    
    return isOwnInspection && isSameDay;
  };

  const canDelete = () => hasAdminAccess;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      const { error } = await supabase
        .from("vehicle_spill_kit_checks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", inspectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inspection deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["spill-kit-inspection-history"] });
      setShowDeleteModal(false);
      setInspectionToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete inspection");
      console.error("Delete error:", error);
    }
  });

  const handleViewInspection = (inspection: InspectionRecord) => {
    setSelectedInspectionId(inspection.id);
    setEditMode(false);
    setIsDetailModalOpen(true);
  };

  const handleEditInspection = (inspection: InspectionRecord) => {
    setSelectedInspectionId(inspection.id);
    setEditMode(true);
    setIsDetailModalOpen(true);
  };

  const handleDeleteClick = (inspection: InspectionRecord) => {
    setInspectionToDelete(inspection);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (inspectionToDelete) {
      deleteMutation.mutate(inspectionToDelete.id);
    }
  };

  const { data: allInspections, isLoading } = useQuery({
    queryKey: ["spill-kit-inspection-history", selectedVehicles.map(v => v.id), startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("vehicle_spill_kit_checks")
        .select(`
          id,
          vehicle_id,
          has_kit,
          item_conditions,
          notes,
          created_at,
          checked_by_clerk,
          vehicles(id, license_plate, vehicle_type, make, model, nickname)
        `)
        .is('deleted_at', null)
        .order("created_at", { ascending: false });

      // Filter by selected vehicles
      if (selectedVehicles.length > 0) {
        const vehicleIds = selectedVehicles.map(v => v.id);
        query = query.in("vehicle_id", vehicleIds);
      }

      // Apply date filters
      if (startDate) {
        query = query.gte("created_at", startOfDay(startDate).toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endOfDay(endDate).toISOString());
      }

      const { data: checks, error } = await query;
      if (error) throw error;

      // Get unique clerk user IDs to fetch profiles
      const clerkIds = [...new Set(checks?.map(c => c.checked_by_clerk).filter(Boolean))] as string[];
      
      // Fetch profiles for these clerk IDs
      const { data: profiles } = clerkIds.length > 0 
        ? await supabase
            .from("profiles")
            .select("clerk_user_id, first_name, last_name")
            .in("clerk_user_id", clerkIds)
        : { data: [] };

      // Create a lookup map for profiles
      const profileMap: Record<string, { first_name: string | null, last_name: string | null }> = {};
      profiles?.forEach(p => {
        if (p.clerk_user_id) {
          profileMap[p.clerk_user_id] = {
            first_name: p.first_name,
            last_name: p.last_name
          };
        }
      });

      return checks?.map((check) => {
        const vehicleName = check.vehicles?.make && check.vehicles?.model 
          ? `${check.vehicles.make} ${check.vehicles.model}${check.vehicles.nickname ? ` - ${check.vehicles.nickname}` : ''}`
          : check.vehicles?.vehicle_type || 'Unknown';

        const profile = check.checked_by_clerk ? profileMap[check.checked_by_clerk] : null;
        const performedBy = profile?.first_name && profile?.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : 'System';

        return {
          id: check.id,
          vehicle_id: check.vehicle_id,
          vehicle_name: vehicleName,
          license_plate: check.vehicles?.license_plate || 'N/A',
          has_kit: check.has_kit,
          item_conditions: check.item_conditions,
          created_at: check.created_at,
          performed_by: performedBy
        };
      }) || [];
    }
  });

  // Filter inspections by search text
  const filteredInspections = React.useMemo(() => {
    if (!allInspections) return [];
    
    if (!searchText.trim()) return allInspections;
    
    const searchLower = searchText.toLowerCase();
    return allInspections.filter(inspection => 
      inspection.vehicle_name.toLowerCase().includes(searchLower) ||
      inspection.license_plate.toLowerCase().includes(searchLower) ||
      inspection.performed_by.toLowerCase().includes(searchLower)
    );
  }, [allInspections, searchText]);

  // Paginate filtered inspections
  const totalPages = Math.ceil(filteredInspections.length / rowsPerPage);
  const paginatedInspections = React.useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredInspections.slice(startIndex, endIndex);
  }, [filteredInspections, currentPage, rowsPerPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedVehicles, searchText, startDate, endDate]);

  const getExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    
    const today = new Date();
    const expiry = parseISO(expirationDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { status: 'expired', badge: <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Expired</Badge> };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', badge: <Badge className="bg-yellow-600 gap-1"><Clock className="h-3 w-3" />{daysUntilExpiry}d</Badge> };
    }
    return { status: 'ok', badge: <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />{daysUntilExpiry}d</Badge> };
  };

  const InspectionRow = ({ inspection }: { inspection: InspectionRecord }) => {
    const [isOpen, setIsOpen] = useState(false);
    const conditions = inspection.item_conditions as any || {};
    const itemsWithExpiration = Object.entries(conditions).filter(([_, cond]: [string, any]) => cond.expiration_date);

    return (
      <>
        <TableRow className="hover:bg-muted/50">
          <TableCell>
            <div className="flex items-center gap-2">
              {itemsWithExpiration.length > 0 && (
                <button onClick={() => setIsOpen(!isOpen)} className="p-0">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {format(parseISO(inspection.created_at), 'MMM dd, yyyy HH:mm')}
            </div>
          </TableCell>
          <TableCell>
            <div>
              <div className="font-medium">{inspection.vehicle_name}</div>
              <div className="text-sm text-muted-foreground">{inspection.license_plate}</div>
            </div>
          </TableCell>
          <TableCell>
            {inspection.has_kit ? (
              <Badge className="gap-1 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold"><CheckCircle className="h-3 w-3" />Present</Badge>
            ) : (
              <Badge className="gap-1 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold"><XCircle className="h-3 w-3" />Missing</Badge>
            )}
          </TableCell>
          <TableCell>
            {itemsWithExpiration.length > 0 ? (
              <span className="text-sm">{itemsWithExpiration.length} items tracked</span>
            ) : (
              <span className="text-sm text-muted-foreground">No expiration data</span>
            )}
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{inspection.performed_by}</TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewInspection(inspection)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                {canEdit(inspection) && (
                  <DropdownMenuItem onClick={() => handleEditInspection(inspection)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete() && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(inspection)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {isOpen && itemsWithExpiration.length > 0 && (
          <TableRow>
            <TableCell colSpan={5} className="bg-muted/20">
              <div className="p-4 space-y-2">
                <h4 className="font-medium text-sm mb-3">Items with Expiration Tracking</h4>
                <div className="grid gap-2">
                  {itemsWithExpiration.map(([itemId, condition]: [string, any]) => {
                    const expirationStatus = getExpirationStatus(condition.expiration_date);
                    return (
                      <div key={itemId} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{condition.item_name || itemId}</p>
                          {condition.item_category && (
                            <p className="text-xs text-muted-foreground">{condition.item_category}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Expires: </span>
                            <span className="font-medium">{format(parseISO(condition.expiration_date), 'MMM dd, yyyy')}</span>
                          </div>
                          {expirationStatus?.badge}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">Loading inspection history...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Inspection History</h3>
        <p className="text-sm text-muted-foreground">View past inspections and tracked expiration dates</p>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3">
        {/* Vehicle Multi-Select Filter */}
        <Button
          variant="outline"
          onClick={() => setIsVehicleModalOpen(true)}
          className="justify-start"
        >
          <Truck className="mr-2 h-4 w-4" />
          {selectedVehicles.length === 0 ? (
            "All Vehicles"
          ) : selectedVehicles.length === 1 ? (
            `${selectedVehicles[0].license_plate || 'Vehicle'}`
          ) : (
            `${selectedVehicles.length} Vehicles`
          )}
        </Button>

        {/* Start Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal min-w-[140px]",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* End Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal min-w-[140px]",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicle, plate, or person..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Clear Filters and Results Count Row */}
      {(searchText || selectedVehicles.length > 0 || startDate || endDate) && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSearchText("");
              setSelectedVehicles([]);
              setStartDate(undefined);
              setEndDate(undefined);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
          <p className="text-sm text-muted-foreground">
            Showing {filteredInspections.length} of {allInspections?.length || 0} inspections
          </p>
        </div>
      )}

      {/* Vehicle Multi-Select Modal */}
      <MultiSelectVehicleFilter
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedVehicles={selectedVehicles}
        onVehiclesChange={setSelectedVehicles}
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Kit Status</TableHead>
              <TableHead>Tracked Items</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInspections && paginatedInspections.length > 0 ? (
              paginatedInspections.map((inspection) => (
                <InspectionRow key={inspection.id} inspection={inspection} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {isLoading ? "Loading..." : "No inspection records found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredInspections.length} total records)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <SpillKitInspectionDetailModal
        inspectionId={selectedInspectionId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedInspectionId(null);
          setEditMode(false);
        }}
        onDeleted={() => {
          // Refresh happens automatically via query invalidation
        }}
        onSaved={() => {
          // Refresh happens automatically via query invalidation
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setInspectionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Inspection"
        description="Are you sure you want to delete this spill kit inspection? This action cannot be undone."
        confirmText="Delete Inspection"
      />
    </div>
  );
}
