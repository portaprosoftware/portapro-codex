import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Download, Plus, Search, Truck, Users, X, TruckIcon, Fuel, Container } from 'lucide-react';
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
import { useFuelManagementSettings } from '@/hooks/useFuelManagementSettings';

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

export const FuelAllLogsTab: React.FC<{ 
  showAddModal?: boolean;
  setShowAddModal?: (show: boolean) => void;
  showExportModal?: boolean;
  setShowExportModal?: (show: boolean) => void;
}> = ({ 
  showAddModal: externalShowAddModal, 
  setShowAddModal: externalSetShowAddModal,
  showExportModal: externalShowExportModal,
  setShowExportModal: externalSetShowExportModal 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<Driver[]>([]);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<FuelSourceType[]>([]);
  const [internalShowAddModal, setInternalShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [internalShowExportModal, setInternalShowExportModal] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);

  const showAddModal = externalShowAddModal !== undefined ? externalShowAddModal : internalShowAddModal;
  const setShowAddModal = externalSetShowAddModal || setInternalShowAddModal;
  const showExportModal = externalShowExportModal !== undefined ? externalShowExportModal : internalShowExportModal;
  const setShowExportModal = externalSetShowExportModal || setInternalShowExportModal;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: fuelSettings } = useFuelManagementSettings();

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
      case 'retail_station':
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"><Fuel className="h-3 w-3 mr-1" />Retail</Badge>;
      case 'yard_tank':
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold"><Container className="h-3 w-3 mr-1" />Yard Tank</Badge>;
      case 'mobile_service':
        return <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"><TruckIcon className="h-3 w-3 mr-1" />Mobile Service</Badge>;
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
          {/* Search Bar Row */}
          <div className="flex items-center gap-4 mb-4">
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                  {fuelSettings?.retail_enabled && (
                    <SelectItem value="retail">Retail Stations</SelectItem>
                  )}
                  {fuelSettings?.yard_tank_enabled && (
                    <SelectItem value="yard_tank">Yard Tanks</SelectItem>
                  )}
                  {fuelSettings?.mobile_service_enabled && (
                    <SelectItem value="mobile_service">Mobile Vendors</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => setIsVehicleModalOpen(true)}
                className="w-full justify-start h-9"
              >
                <Truck className="h-4 w-4 mr-1.5" />
                {selectedVehicleCount === 0
                  ? "All vehicles"
                  : `${selectedVehicleCount} selected`}
              </Button>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => setIsDriverModalOpen(true)}
                className="w-full justify-start h-9"
              >
                <Users className="h-4 w-4 mr-1.5" />
                {selectedDriverCount === 0
                  ? "All drivers"
                  : `${selectedDriverCount} selected`}
              </Button>
            </div>

            <div>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Date range"
                className="h-9"
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