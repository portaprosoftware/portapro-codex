import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, differenceInDays, startOfDay, endOfDay } from "date-fns";
import { CheckCircle, XCircle, Clock, AlertTriangle, CalendarIcon, Search, ChevronLeft, ChevronRight as ChevronRightIcon, Truck, Filter as FilterIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiSelectVehicleFilter } from "../MultiSelectVehicleFilter";

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
  const rowsPerPage = 25;

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
        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setIsOpen(!isOpen)}>
          <TableCell>
            <div className="flex items-center gap-2">
              {itemsWithExpiration.length > 0 && (
                isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
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
              <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />Present</Badge>
            ) : (
              <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Missing</Badge>
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
      {/* Header with Search */}
      <div className="flex items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Inspection History</h3>
          <p className="text-sm text-muted-foreground">View past inspections and tracked expiration dates</p>
        </div>
        <div className="relative w-[27rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicle, plate, or person..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                "justify-start text-left font-normal",
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
                "justify-start text-left font-normal",
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
      </div>

      {/* Clear Filters */}
      {(searchText || selectedVehicles.length > 0 || startDate || endDate) && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchText("");
              setSelectedVehicles([]);
              setStartDate(undefined);
              setEndDate(undefined);
            }}
          >
            Clear all filters
          </Button>
          <span className="text-sm text-muted-foreground">
            Showing {filteredInspections.length} of {allInspections?.length || 0} inspections
          </span>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInspections && paginatedInspections.length > 0 ? (
              paginatedInspections.map((inspection) => (
                <InspectionRow key={inspection.id} inspection={inspection} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
    </div>
  );
}
