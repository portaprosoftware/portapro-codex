import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Download, Plus, Search, Truck, Users, X } from 'lucide-react';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch fuel logs with filters
  const { data: fuelLogs, isLoading, isFetching } = useQuery({
    queryKey: ['fuel-logs', searchTerm, selectedVehicles, selectedDrivers, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('fuel_logs')
        .select(`
          id,
          log_date,
          odometer_reading,
          gallons_purchased,
          cost_per_gallon,
          total_cost,
          fuel_station,
          notes,
          vehicles!inner(license_plate, vehicle_type, make, model, nickname),
          profiles!inner(first_name, last_name)
        `)
        .order('log_date', { ascending: false });

      // Apply filters
      if (selectedVehicles && selectedVehicles.length > 0) {
        const vehicleIds = selectedVehicles.map(v => v.id);
        query = query.in('vehicle_id', vehicleIds);
      }
      
      if (selectedDrivers && selectedDrivers.length > 0) {
        const driverIds = selectedDrivers.map(d => d.id);
        query = query.in('driver_id', driverIds);
      }

      if (dateRange?.from) {
        query = query.gte('log_date', dateRange.from.toISOString().split('T')[0]);
      }
      
      if (dateRange?.to) {
        query = query.lte('log_date', dateRange.to.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Map the data to match expected interface
      let mappedData = data?.map(log => ({
        id: log.id,
        log_date: log.log_date,
        odometer_reading: log.odometer_reading,
        gallons_purchased: log.gallons_purchased,
        cost_per_gallon: log.cost_per_gallon,
        total_cost: log.total_cost,
        fuel_station: log.fuel_station,
        notes: log.notes,
        vehicle: {
          license_plate: log.vehicles?.license_plate || 'Unknown',
          vehicle_type: log.vehicles?.vehicle_type || 'Unknown',
          make: log.vehicles?.make,
          model: log.vehicles?.model,
          nickname: log.vehicles?.nickname
        },
        driver: {
          first_name: log.profiles?.first_name || 'Unknown',
          last_name: log.profiles?.last_name || 'Driver'
        }
      })) || [];
      
      // Filter by search term locally
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        mappedData = mappedData.filter(log => 
          log.vehicle?.license_plate?.toLowerCase().includes(term) ||
          log.fuel_station?.toLowerCase().includes(term) ||
          `${log.driver?.first_name} ${log.driver?.last_name}`.toLowerCase().includes(term)
        );
      }
      
      return mappedData as FuelLog[];
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false
  });

  // Get selected counts for display
  const selectedVehicleCount = selectedVehicles.length;
  const selectedDriverCount = selectedDrivers.length;
  const hasActiveFilters = selectedVehicleCount > 0 || selectedDriverCount > 0;

  const clearAllFilters = () => {
    setSelectedVehicles([]);
    setSelectedDrivers([]);
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
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search Logs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => setIsVehicleModalOpen(true)}
                className="w-full justify-start"
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
                className="w-full justify-start"
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
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Gallons</TableHead>
                  <TableHead>Cost/Gal</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelLogs && fuelLogs.length > 0 ? (
                  fuelLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.log_date).toLocaleDateString()}</TableCell>
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
                      <TableCell>{log.odometer_reading?.toLocaleString()}</TableCell>
                      <TableCell>{log.gallons_purchased}</TableCell>
                      <TableCell>${log.cost_per_gallon?.toFixed(3)}</TableCell>
                      <TableCell className="font-semibold">${log.total_cost?.toFixed(2)}</TableCell>
                      <TableCell>{log.fuel_station || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditLog(log)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deleteFuelLogMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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