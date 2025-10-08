import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Download, Plus, Search, Truck, Users, X, Store, Factory, TruckIcon } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AddFuelLogModal } from './AddFuelLogModal';
import { EditFuelLogModal } from './EditFuelLogModal';
import { ExportFuelDataModal } from './ExportFuelDataModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelectVehicleFilter } from '../MultiSelectVehicleFilter';
import { MultiSelectDriverFilter } from '../MultiSelectDriverFilter';
import { useUnifiedFuelConsumption, FuelSourceType } from '@/hooks/useUnifiedFuelConsumption';

interface Vehicle {
  id: string;
  license_plate: string | null;
  vehicle_type?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  status?: string | null;
  vehicle_image?: string | null;
  nickname?: string | null;
}

interface Driver {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  clerk_user_id: string | null;
}

interface FuelLog {
  id: string;
  log_date: string;
  vehicle: {
    license_plate: string;
    vehicle_type: string;
    make?: string;
    model?: string;
    nickname?: string;
  };
  driver: {
    first_name: string;
    last_name: string;
  };
  odometer_reading: number;
  gallons_purchased: number;
  cost_per_gallon: number;
  total_cost: number;
  fuel_station: string;
  notes: string;
}

export const FuelAllLogsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<Driver[]>([]);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<FuelSourceType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch unified fuel consumption data
  const { data: unifiedData, isLoading, isFetching } = useUnifiedFuelConsumption({
    sourceTypes: selectedSourceTypes.length > 0 ? selectedSourceTypes : undefined,
    vehicleIds: selectedVehicles.map(v => v.id),
    driverIds: selectedDrivers.map(d => d.id),
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
    searchTerm
  });

  // Fetch vehicle and driver details for display
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-lookup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model, nickname');
      if (error) throw error;
      return data;
    }
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers-lookup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      if (error) throw error;
      return data;
    }
  });

  // Map unified data to display format
  const fuelLogs = unifiedData?.map(log => {
    const vehicle = vehicles?.find(v => v.id === log.vehicle_id);
    const driver = drivers?.find(d => d.id === log.driver_id);

    return {
      id: log.reference_id,
      log_date: log.fuel_date,
      source_type: log.source_type,
      source_name: log.source_name,
      vehicle: {
        license_plate: vehicle?.license_plate || 'Unknown',
        vehicle_type: '',
        make: vehicle?.make,
        model: vehicle?.model,
        nickname: vehicle?.nickname
      },
      driver: {
        first_name: driver?.first_name || 'Unknown',
        last_name: driver?.last_name || ''
      },
      odometer_reading: log.odometer_reading || 0,
      gallons_purchased: log.gallons,
      cost_per_gallon: log.cost_per_gallon,
      total_cost: log.cost,
      fuel_station: log.source_name,
      notes: log.notes || ''
    };
  }) || [];

  // Get selected counts for display
  const selectedVehicleCount = selectedVehicles.length;
  const selectedDriverCount = selectedDrivers.length;
  const selectedSourceCount = selectedSourceTypes.length;
  const hasActiveFilters = selectedVehicleCount > 0 || selectedDriverCount > 0 || selectedSourceCount > 0;

  const clearAllFilters = () => {
    setSelectedVehicles([]);
    setSelectedDrivers([]);
    setSelectedSourceTypes([]);
  };

  const getSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'retail':
        return <Badge className="bg-blue-500 text-white"><Store className="h-3 w-3 mr-1" />Retail</Badge>;
      case 'yard_tank':
        return <Badge className="bg-green-500 text-white"><Factory className="h-3 w-3 mr-1" />Yard Tank</Badge>;
      case 'mobile_service':
        return <Badge className="bg-purple-500 text-white"><TruckIcon className="h-3 w-3 mr-1" />Mobile Vendor</Badge>;
      default:
        return <Badge variant="outline">{sourceType}</Badge>;
    }
  };

  const deleteFuelLogMutation = useMutation({
    mutationFn: async (id: string) => {
      // Try Edge Function first, then fallback to direct delete
      try {
        const { error: fnError } = await supabase.functions.invoke('fleet-writes', {
          body: { action: 'delete_fuel_log', payload: { id } }
        });
        if (fnError) throw fnError;
        return;
      } catch (_) {
        const { error } = await supabase
          .from('fuel_logs')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Fuel log deleted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['recent-fuel-logs'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete fuel log',
        variant: 'destructive'
      });
    }
  });

  const handleEditLog = (log: FuelLog) => {
    setEditingLog(log);
    setShowEditModal(true);
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm('Are you sure you want to delete this fuel log?')) {
      deleteFuelLogMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {isLoading && !fuelLogs && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {/* Filters Title and Search Bar Row */}
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-base font-semibold">Filters</h3>
            <div className="flex-1">
              <Input
                placeholder="Search Logs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Filter Buttons Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Select
                value={selectedSourceTypes.length === 0 ? 'all' : selectedSourceTypes[0]}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedSourceTypes([]);
                  } else {
                    setSelectedSourceTypes([value as FuelSourceType]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="retail">🏪 Retail Stations</SelectItem>
                  <SelectItem value="yard_tank">🏭 Yard Tanks</SelectItem>
                  <SelectItem value="mobile_service">🚛 Mobile Vendors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => setIsVehicleModalOpen(true)}
                className="w-full justify-start hover:scale-[1.02] transition-transform"
              >
                <Truck className="h-4 w-4 mr-2" />
                {selectedVehicleCount === 0
                  ? "All vehicles"
                  : `${selectedVehicleCount} vehicle${selectedVehicleCount > 1 ? 's' : ''} selected`}
              </Button>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => setIsDriverModalOpen(true)}
                className="w-full justify-start hover:scale-[1.02] transition-transform"
              >
                <Users className="h-4 w-4 mr-2" />
                {selectedDriverCount === 0
                  ? "All drivers"
                  : `${selectedDriverCount} driver${selectedDriverCount > 1 ? 's' : ''} selected`}
              </Button>
            </div>

            <div>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Select date range"
              />
            </div>

            <div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="w-full justify-start hover:scale-[1.02] transition-transform text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-primary to-primary-variant"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Fuel Log
          </Button>
        </div>
        
        <Button 
          onClick={() => setShowExportModal(true)}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Gallons</TableHead>
                  <TableHead>Cost/Gal</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelLogs && fuelLogs.length > 0 ? (
                  fuelLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.log_date).toLocaleDateString()}</TableCell>
                      <TableCell>{getSourceBadge(log.source_type)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {log.vehicle?.make && log.vehicle?.model 
                              ? `${log.vehicle.make} ${log.vehicle.model}${log.vehicle.nickname ? ` - ${log.vehicle.nickname}` : ''}`
                              : 'Unknown Vehicle'}
                          </div>
                          <div className="text-sm text-muted-foreground">{log.vehicle?.license_plate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.driver ? `${log.driver.first_name} ${log.driver.last_name}` : 'Unknown'}
                      </TableCell>
                      <TableCell>{log.odometer_reading?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>{log.gallons_purchased?.toFixed(1)}</TableCell>
                      <TableCell>${log.cost_per_gallon?.toFixed(3)}</TableCell>
                      <TableCell className="font-semibold">${log.total_cost?.toFixed(2)}</TableCell>
                      <TableCell>{log.source_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditLog(log)}
                            disabled={log.source_type !== 'retail'}
                            title={log.source_type !== 'retail' ? 'Only retail logs can be edited here' : 'Edit log'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deleteFuelLogMutation.isPending || log.source_type !== 'retail'}
                            title={log.source_type !== 'retail' ? 'Only retail logs can be deleted here' : 'Delete log'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No fuel logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddFuelLogModal open={showAddModal} onOpenChange={setShowAddModal} />
      <EditFuelLogModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        fuelLog={editingLog}
      />
      <ExportFuelDataModal open={showExportModal} onOpenChange={setShowExportModal} />
      
      {/* Vehicle Multi-Select Modal */}
      <MultiSelectVehicleFilter
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedVehicles={selectedVehicles}
        onVehiclesChange={setSelectedVehicles}
      />
      
      {/* Driver Multi-Select Modal */}
      <MultiSelectDriverFilter
        open={isDriverModalOpen}
        onOpenChange={setIsDriverModalOpen}
        selectedDrivers={selectedDrivers}
        onDriversChange={setSelectedDrivers}
      />
    </div>
  );
};