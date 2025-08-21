import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/statusBadgeUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar as CalendarIcon,
  Download,
  MapPin,
  Camera,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ServiceHistoryTabProps {
  customerId: string;
}

interface ServiceRecord {
  id: string;
  job_number: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  actual_completion_time: string | null;
  driver_id: string | null;
  driver_name?: string;
  location_name?: string;
  gps_coordinates?: { lat: number; lng: number };
  photos: string[];
  notes: string;
  checklist_results?: any;
  service_rating?: number;
}

export const ServiceHistoryTab: React.FC<ServiceHistoryTabProps> = ({ customerId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch service history with related data
  const { data: serviceHistory = [], isLoading } = useQuery({
    queryKey: ['service-history', customerId, searchTerm, dateRange, selectedLocation, selectedServiceType],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          job_type,
          status,
          scheduled_date,
          actual_completion_time,
          driver_id,
          notes
        `)
        .eq('customer_id', customerId)
        .in('status', ['completed', 'cancelled'])
        .order('scheduled_date', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`job_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
      }

      if (dateRange.from) {
        query = query.gte('scheduled_date', dateRange.from.toISOString().split('T')[0]);
      }

      if (dateRange.to) {
        query = query.lte('scheduled_date', dateRange.to.toISOString().split('T')[0]);
      }

      if (selectedServiceType !== 'all') {
        query = query.eq('job_type', selectedServiceType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform data to include mock additional details for now
      return (data || []).map(job => ({
        ...job,
        driver_name: job.driver_id ? `Driver ${job.driver_id.slice(-4)}` : 'Unassigned',
        location_name: 'Service Location', // Will be fetched separately
        gps_coordinates: { lat: 40.7128, lng: -74.0060 }, // Mock GPS for now
        photos: [], // Will be populated from actual storage
        checklist_results: {
          items_completed: Math.floor(Math.random() * 10) + 5,
          total_items: 15,
          quality_score: Math.floor(Math.random() * 30) + 70
        },
        service_rating: Math.floor(Math.random() * 2) + 4
      }));
    },
    enabled: !!customerId,
  });

  // Fetch service locations for filter
  const { data: serviceLocations = [] } = useQuery({
    queryKey: ['service-locations', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('id, location_name')
        .eq('customer_id', customerId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const handleRequestReClean = (jobId: string) => {
    // TODO: Create new service request
    console.log('Request re-clean for job:', jobId);
  };

  const handleDisputeService = (jobId: string) => {
    // TODO: Open support ticket
    console.log('Dispute service for job:', jobId);
  };

  const handleDownloadReport = (jobId: string) => {
    // TODO: Generate and download PDF
    console.log('Download report for job:', jobId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Service History</h3>
            <p className="text-sm text-muted-foreground">
              Complete documentation of all services performed
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by job number, notes, or technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => setDateRange(range || {})}
                        numberOfMonths={2}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Service Location */}
                <div className="space-y-2">
                  <Label>Service Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {serviceLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Type */}
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setDateRange({});
                      setSelectedLocation('all');
                      setSelectedServiceType('all');
                    }}
                    className="w-full"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Records */}
      <div className="space-y-4">
        {serviceHistory.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No service history found</h3>
              <p className="text-muted-foreground">
                {searchTerm || Object.keys(dateRange).length > 0 || selectedLocation !== 'all' || selectedServiceType !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Service records will appear here once work is completed'}
              </p>
            </CardContent>
          </Card>
        ) : (
          serviceHistory.map((service) => {
            const StatusIcon = getStatusIcon(service.status);
            
            return (
              <Card key={service.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold capitalize">
                          {service.job_type.replace('_', ' ')}
                        </h4>
                        <Badge variant={getStatusBadgeVariant(service.status as any)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {service.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {service.job_number}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {service.driver_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {service.location_name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {format(new Date(service.scheduled_date), 'MMM dd, yyyy')}
                      </div>
                      {service.actual_completion_time && (
                        <div className="text-muted-foreground">
                          Completed: {format(new Date(service.actual_completion_time), 'h:mm a')}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Service Details Tabs */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="photos">Photos</TabsTrigger>
                      <TabsTrigger value="checklist">Checklist</TabsTrigger>
                      <TabsTrigger value="location">Location</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-3 mt-4">
                      {service.notes && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Service Notes
                          </Label>
                          <p className="text-sm mt-1">{service.notes}</p>
                        </div>
                      )}
                      
                      {service.checklist_results && (
                        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-semibold">
                              {service.checklist_results.items_completed}/{service.checklist_results.total_items}
                            </div>
                            <div className="text-xs text-muted-foreground">Tasks Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-success">
                              {service.checklist_results.quality_score}%
                            </div>
                            <div className="text-xs text-muted-foreground">Quality Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">
                              {"★".repeat(service.service_rating || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Service Rating</div>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="photos" className="mt-4">
                      <div className="text-center py-8 text-muted-foreground">
                        <Camera className="h-8 w-8 mx-auto mb-2" />
                        <p>Service photos will be displayed here</p>
                        <p className="text-xs">Feature coming soon</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="checklist" className="mt-4">
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Detailed checklist results will be shown here</p>
                        <p className="text-xs">Feature coming soon</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="location" className="mt-4">
                      {service.gps_coordinates ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>GPS: {service.gps_coordinates.lat.toFixed(6)}, {service.gps_coordinates.lng.toFixed(6)}</span>
                          </div>
                          <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-muted-foreground">Interactive map coming soon</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="h-8 w-8 mx-auto mb-2" />
                          <p>No GPS coordinates recorded for this service</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(service.id)}
                      className="gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download Report
                    </Button>
                    
                    {service.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestReClean(service.id)}
                          className="gap-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Request Re-clean
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisputeService(service.id)}
                          className="gap-1"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Dispute Service
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};