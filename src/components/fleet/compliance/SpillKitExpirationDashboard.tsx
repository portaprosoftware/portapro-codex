import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, Search } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { SpillKitExpirationReport } from "./SpillKitExpirationReport";

type ExpirationItem = {
  id: string;
  vehicle_id: string;
  vehicle_name: string;
  license_plate: string;
  item_name: string;
  item_category: string;
  expiration_date: string;
  last_inspection_date: string;
  check_id: string;
  days_until_expiry: number;
  status: 'expired' | 'expiring_soon' | 'ok';
};

export function SpillKitExpirationDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Fetch all spill kit checks with expiration tracking
  const { data: expirationData, isLoading } = useQuery({
    queryKey: ["spill-kit-expirations"],
    queryFn: async () => {
      const { data: checks, error } = await supabase
        .from("vehicle_spill_kit_checks")
        .select(`
          id,
          vehicle_id,
          has_kit,
          item_conditions,
          created_at,
          vehicles(id, license_plate, vehicle_type, make, model, nickname)
        `)
        .eq("has_kit", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const items: ExpirationItem[] = [];
      const today = new Date();

      checks?.forEach((check) => {
        const conditions = check.item_conditions as any;
        if (!conditions) return;

        // Get the latest inspection date for this vehicle
        const inspectionDate = check.created_at;

        Object.entries(conditions).forEach(([itemId, condition]: [string, any]) => {
          if (condition.expiration_date) {
            const expiryDate = parseISO(condition.expiration_date);
            const daysUntilExpiry = differenceInDays(expiryDate, today);
            
            let status: 'expired' | 'expiring_soon' | 'ok' = 'ok';
            if (daysUntilExpiry < 0) status = 'expired';
            else if (daysUntilExpiry <= 30) status = 'expiring_soon';

            const vehicleName = check.vehicles?.make && check.vehicles?.model 
              ? `${check.vehicles.make} ${check.vehicles.model}${check.vehicles.nickname ? ` - ${check.vehicles.nickname}` : ''}`
              : check.vehicles?.vehicle_type || 'Unknown';
            
            items.push({
              id: `${check.id}-${itemId}`,
              vehicle_id: check.vehicle_id,
              vehicle_name: vehicleName,
              license_plate: check.vehicles?.license_plate || 'N/A',
              item_name: condition.item_name || itemId,
              item_category: condition.item_category || 'Uncategorized',
              expiration_date: condition.expiration_date,
              last_inspection_date: inspectionDate,
              check_id: check.id,
              days_until_expiry: daysUntilExpiry,
              status
            });
          }
        });
      });

      // Keep only the most recent expiration for each vehicle-item combination
      const uniqueItems = new Map<string, ExpirationItem>();
      items.forEach(item => {
        const key = `${item.vehicle_id}-${item.item_name}`;
        const existing = uniqueItems.get(key);
        if (!existing || new Date(item.last_inspection_date) > new Date(existing.last_inspection_date)) {
          uniqueItems.set(key, item);
        }
      });

      return Array.from(uniqueItems.values());
    }
  });

  // Get unique vehicles and categories for filters
  const { vehicles, categories } = useMemo(() => {
    if (!expirationData) return { vehicles: [], categories: [] };
    
    const vehicleSet = new Set(expirationData.map(item => `${item.vehicle_id}|${item.vehicle_name}|${item.license_plate}`));
    const categorySet = new Set(expirationData.map(item => item.item_category));
    
    return {
      vehicles: Array.from(vehicleSet).map(v => {
        const [id, name, plate] = v.split('|');
        return { id, name, plate };
      }),
      categories: Array.from(categorySet)
    };
  }, [expirationData]);

  // Filter and group items
  const { expired, expiringSoon, ok, filteredItems } = useMemo(() => {
    if (!expirationData) return { expired: [], expiringSoon: [], ok: [], filteredItems: [] };

    let filtered = expirationData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply vehicle filter
    if (filterVehicle !== "all") {
      filtered = filtered.filter(item => item.vehicle_id === filterVehicle);
    }

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(item => item.item_category === filterCategory);
    }

    return {
      expired: filtered.filter(item => item.status === 'expired'),
      expiringSoon: filtered.filter(item => item.status === 'expiring_soon'),
      ok: filtered.filter(item => item.status === 'ok'),
      filteredItems: filtered
    };
  }, [expirationData, searchTerm, filterVehicle, filterCategory]);

  const getStatusBadge = (status: ExpirationItem['status'], daysUntilExpiry: number) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Expired</Badge>;
      case 'expiring_soon':
        return <Badge variant="default" className="gap-1 bg-yellow-600"><Clock className="h-3 w-3" />{daysUntilExpiry} days</Badge>;
      case 'ok':
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />{daysUntilExpiry} days</Badge>;
    }
  };

  const renderTable = (items: ExpirationItem[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vehicle</TableHead>
          <TableHead>Item Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Expiration Date</TableHead>
          <TableHead>Last Inspected</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No items found
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{item.vehicle_name}</div>
                  <div className="text-sm text-muted-foreground">{item.license_plate}</div>
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.item_name}</TableCell>
              <TableCell>{item.item_category}</TableCell>
              <TableCell>{format(parseISO(item.expiration_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(parseISO(item.last_inspection_date), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>{getStatusBadge(item.status, item.days_until_expiry)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">Loading expiration data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-l-4 border-l-destructive">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired Items</p>
              <p className="text-3xl font-bold text-destructive">{expired.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expiring Soon (30 days)</p>
              <p className="text-3xl font-bold text-yellow-600">{expiringSoon.length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Items OK</p>
              <p className="text-3xl font-bold text-green-600">{ok.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items or vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterVehicle} onValueChange={setFilterVehicle}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} - {v.plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabbed View */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Items ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expired.length})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon ({expiringSoon.length})</TabsTrigger>
          <TabsTrigger value="ok">OK ({ok.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>{renderTable(filteredItems)}</Card>
        </TabsContent>

        <TabsContent value="expired">
          <Card>{renderTable(expired)}</Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card>{renderTable(expiringSoon)}</Card>
        </TabsContent>

        <TabsContent value="ok">
          <Card>{renderTable(ok)}</Card>
        </TabsContent>

        <TabsContent value="analytics">
          <SpillKitExpirationReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
