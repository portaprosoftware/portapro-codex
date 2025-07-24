import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Truck, 
  Package, 
  Edit3, 
  Save, 
  X,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface JobDetailModalProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  jobId,
  open,
  onOpenChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch job details
  const { data: job, isLoading } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers!inner(id, name, email, phone, service_street, service_city, service_state, service_zip),
          profiles:driver_id(id, first_name, last_name, email),
          vehicles(id, license_plate, vehicle_type),
          equipment_assignments(
            id,
            quantity,
            assigned_date,
            return_date,
            status,
            products(id, name),
            product_items(id, item_code, status)
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!jobId && open
  });

  // Fetch drivers and vehicles for editing
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    enabled: isEditing
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
    enabled: isEditing
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!jobId) throw new Error('No job ID');
      
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job Updated",
        description: "Job details have been updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
      console.error('Job update error:', error);
    }
  });

  const [editForm, setEditForm] = useState({
    scheduled_date: '',
    scheduled_time: '',
    driver_id: '',
    vehicle_id: '',
    notes: '',
    special_instructions: '',
    status: ''
  });

  React.useEffect(() => {
    if (job && isEditing) {
      setEditForm({
        scheduled_date: job.scheduled_date || '',
        scheduled_time: job.scheduled_time || '',
        driver_id: job.driver_id || '',
        vehicle_id: job.vehicle_id || '',
        notes: job.notes || '',
        special_instructions: job.special_instructions || '',
        status: job.status || ''
      });
    }
  }, [job, isEditing]);

  const handleSave = () => {
    updateJobMutation.mutate(editForm);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (job) {
      setEditForm({
        scheduled_date: job.scheduled_date || '',
        scheduled_time: job.scheduled_time || '',
        driver_id: job.driver_id || '',
        vehicle_id: job.vehicle_id || '',
        notes: job.notes || '',
        special_instructions: job.special_instructions || '',
        status: job.status || ''
      });
    }
  };

  const statusConfig = {
    assigned: { 
      gradient: 'bg-gradient-blue', 
      label: 'Assigned' 
    },
    in_progress: { 
      gradient: 'bg-gradient-orange', 
      label: 'In Progress' 
    },
    'in-progress': { 
      gradient: 'bg-gradient-orange', 
      label: 'In Progress' 
    },
    completed: { 
      gradient: 'bg-gradient-green', 
      label: 'Completed' 
    },
    cancelled: { 
      gradient: 'bg-gradient-red', 
      label: 'Cancelled' 
    },
    pending: { 
      gradient: 'bg-gradient-yellow', 
      label: 'Pending' 
    },
    overdue: { 
      gradient: 'bg-gradient-red', 
      label: 'Overdue' 
    }
  };

  const jobTypeConfig = {
    delivery: {
      color: 'bg-gradient-blue',
      label: 'Delivery'
    },
    pickup: {
      color: 'bg-gradient-orange',
      label: 'Pickup'
    },
    service: {
      color: 'bg-gradient-green',
      label: 'Service'
    },
    return: {
      color: 'bg-gradient-purple',
      label: 'Return'
    }
  };

  const getStatusColor = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.gradient || 'bg-gray-500';
  };

  const getJobTypeColor = (type: string) => {
    return jobTypeConfig[type as keyof typeof jobTypeConfig]?.color || 'bg-gray-500';
  };

  if (!job && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px] h-[600px] max-w-none overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl">
                {job?.job_number || 'Loading...'}
              </DialogTitle>
              <div className="flex items-center space-x-2 mt-2">
                {job && (
                  <>
                    <Badge className={cn("text-xs text-white rounded-full", getStatusColor(job.status))}>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={cn("text-xs text-white rounded-full", getJobTypeColor(job.job_type))}>
                      {job.job_type.toUpperCase()}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={updateJobMutation.isPending}
                    className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateJobMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading job details...</p>
            </div>
          </div>
        ) : job ? (
          <div>
            {/* Custom Tab Navigation */}
            <nav className="flex items-center space-x-1 mb-6">
              {[
                { id: 'details', label: 'Details' },
                { id: 'customer', label: 'Customer' },
                { id: 'equipment', label: 'Equipment' },
                { id: 'history', label: 'History' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 font-inter",
                    "flex items-center gap-2",
                    "focus:outline-none",
                    "transform hover:-translate-y-0.5",
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold shadow-sm" 
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Schedule Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label htmlFor="scheduled_date">Date</Label>
                          <Input
                            id="scheduled_date"
                            type="date"
                            value={editForm.scheduled_date}
                            onChange={(e) => setEditForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="scheduled_time">Time</Label>
                          <Input
                            id="scheduled_time"
                            type="time"
                            value={editForm.scheduled_time}
                            onChange={(e) => setEditForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="assigned">Assigned</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {format(new Date(job.scheduled_date), 'MMMM do, yyyy')}
                        </div>
                        {job.scheduled_time && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            {job.scheduled_time}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Assignment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label htmlFor="driver_id">Driver</Label>
                          <Select value={editForm.driver_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, driver_id: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select driver" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No driver assigned</SelectItem>
                              {drivers.map(driver => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.first_name} {driver.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="vehicle_id">Vehicle</Label>
                          <Select value={editForm.vehicle_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, vehicle_id: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No vehicle assigned</SelectItem>
                              {vehicles.map(vehicle => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.license_plate} ({vehicle.vehicle_type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        {job.profiles ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-2" />
                            {job.profiles.first_name} {job.profiles.last_name}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">No driver assigned</div>
                        )}
                        
                        {job.vehicles ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <Truck className="w-4 h-4 mr-2" />
                            {job.vehicles.license_plate} ({job.vehicles.vehicle_type})
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">No vehicle assigned</div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes & Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="notes">General Notes</Label>
                        <Textarea
                          id="notes"
                          value={editForm.notes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="General job notes..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="special_instructions">Special Instructions</Label>
                        <Textarea
                          id="special_instructions"
                          value={editForm.special_instructions}
                          onChange={(e) => setEditForm(prev => ({ ...prev, special_instructions: e.target.value }))}
                          placeholder="Special instructions for this job..."
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {job.notes && (
                        <div>
                          <Label className="text-sm font-medium">General Notes</Label>
                          <p className="text-sm text-gray-600 mt-1">{job.notes}</p>
                        </div>
                      )}
                      {job.special_instructions && (
                        <div>
                          <Label className="text-sm font-medium">Special Instructions</Label>
                          <p className="text-sm text-gray-600 mt-1">{job.special_instructions}</p>
                        </div>
                      )}
                      {!job.notes && !job.special_instructions && (
                        <p className="text-sm text-gray-400">No notes or special instructions</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {activeTab === 'customer' && (
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Customer Name</Label>
                    <p className="text-lg font-semibold">{job.customers.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {job.customers.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{job.customers.email}</span>
                      </div>
                    )}
                    {job.customers.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{job.customers.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {job.customers.service_street && (
                    <div>
                      <Label className="text-sm font-medium">Service Address</Label>
                      <div className="flex items-start space-x-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-sm text-gray-600">
                          {job.customers.service_street}<br />
                          {job.customers.service_city}, {job.customers.service_state} {job.customers.service_zip}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-4">
                    {job.customers.phone && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Customer
                      </Button>
                    )}
                    {job.customers.email && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Customer
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Equipment Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {job.equipment_assignments && job.equipment_assignments.length > 0 ? (
                    <div className="space-y-4">
                      {job.equipment_assignments.map((assignment: any) => (
                        <div key={assignment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">
                                {assignment.products?.name || 'Product'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Quantity: {assignment.quantity}
                              </p>
                              {assignment.product_items && (
                                <p className="text-sm text-gray-600">
                                  Item: {assignment.product_items.item_code}
                                </p>
                              )}
                            </div>
                            <Badge className={getStatusColor(assignment.status)}>
                              {assignment.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Assigned: {format(new Date(assignment.assigned_date), 'MMM d, yyyy')}
                            {assignment.return_date && (
                              <span> - Return: {format(new Date(assignment.return_date), 'MMM d, yyyy')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No equipment assigned to this job</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Package className="w-4 h-4 mr-2" />
                        Assign Equipment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Job history tracking coming soon</p>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};