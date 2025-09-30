import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, differenceInDays } from "date-fns";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  const [filterVehicle, setFilterVehicle] = useState<string>("all");

  const { data: inspections, isLoading } = useQuery({
    queryKey: ["spill-kit-inspection-history", filterVehicle],
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
          vehicles(id, license_plate, vehicle_type, make, model, nickname)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (filterVehicle !== "all") {
        query = query.eq("vehicle_id", filterVehicle);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map((check) => {
        const vehicleName = check.vehicles?.make && check.vehicles?.model 
          ? `${check.vehicles.make} ${check.vehicles.model}${check.vehicles.nickname ? ` - ${check.vehicles.nickname}` : ''}`
          : check.vehicles?.vehicle_type || 'Unknown';

        return {
          id: check.id,
          vehicle_id: check.vehicle_id,
          vehicle_name: vehicleName,
          license_plate: check.vehicles?.license_plate || 'N/A',
          has_kit: check.has_kit,
          item_conditions: check.item_conditions,
          created_at: check.created_at,
          performed_by: 'System' // Default since we don't have performed_by_clerk field
        };
      }) || [];
    }
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-history-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model, nickname")
        .eq("status", "active")
        .order("license_plate");
      if (error) throw error;
      return data || [];
    }
  });

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
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Inspection History</h3>
          <p className="text-sm text-muted-foreground">View past inspections and tracked expiration dates</p>
        </div>
        <Select value={filterVehicle} onValueChange={setFilterVehicle}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicles?.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.license_plate} - {v.make} {v.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            {inspections && inspections.length > 0 ? (
              inspections.map((inspection) => (
                <InspectionRow key={inspection.id} inspection={inspection} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No inspection records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
