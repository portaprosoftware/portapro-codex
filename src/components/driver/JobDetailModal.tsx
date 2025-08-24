import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  Camera, 
  FileSignature,
  CheckCircle,
  PlayCircle,
  MessageSquare,
  FileText,
  RotateCcw,
  User,
  Star,
  Mail,
  Building,
  Key,
  Shield,
  Info
} from 'lucide-react';
import { PhotoCapture } from './PhotoCapture';
import { SignatureCapture } from './SignatureCapture';
import { ServiceReportForm } from './ServiceReportForm';
import { useToast } from '@/hooks/use-toast';
import { getDualJobStatusInfo } from '@/lib/jobStatusUtils';
import { supabase } from '@/integrations/supabase/client';

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  special_instructions?: string;
  customer_id: string;
  contact_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  assigned_template_ids?: any;
  default_template_id?: string;
  is_priority?: boolean;
  locks_requested?: boolean;
  locks_count?: number;
  lock_notes?: string;
  zip_tied_on_dropoff?: boolean;
  customers: {
    name?: string;
    email?: string;
    phone?: string;
    customer_service_locations?: Array<{
      id: string;
      location_name: string;
      street?: string;
      street2?: string;
      city?: string;
      state?: string;
      zip?: string;
      contact_person?: string;
      contact_phone?: string;
      access_instructions?: string;
      notes?: string;
      is_default: boolean;
    }>;
    customer_contacts?: Array<{
      id: string;
      first_name: string;
      last_name: string;
      phone?: string;
      email?: string;
      title?: string;
      contact_type: string;
      is_primary: boolean;
    }>;
  } | null;
  customer_contacts?: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    title?: string;
  } | null;
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  vehicle?: {
    id: string;
    license_plate: string;
    vehicle_type: string;
  } | null;
}

interface JobDetailModalProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}


export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  open,
  onClose,
  onStatusUpdate
}) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showServiceReport, setShowServiceReport] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [assignedTemplates, setAssignedTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (open && job) {
      loadAssignedTemplates();
    }
  }, [open, job]);

  const loadAssignedTemplates = async () => {
    if (!job) return;
    
    setLoadingTemplates(true);
    try {
      // Get templates assigned to this job
      const templateIds = [
        ...(job.assigned_template_ids || []),
        ...(job.default_template_id ? [job.default_template_id] : [])
      ].filter(Boolean);

      if (templateIds.length === 0) {
        // Check for default templates from job services
        const { data: jobItems } = await supabase
          .from('job_items')
          .select(`
            *,
            routine_maintenance_services!inner(
              *,
              template:maintenance_report_templates!default_template_id(*)
            )
          `)
          .eq('job_id', job.id)
          .eq('line_item_type', 'service');

        const serviceTemplates = jobItems
          ?.map(item => (item as any)?.routine_maintenance_services?.template)
          .filter(Boolean) || [];

        setAssignedTemplates(serviceTemplates);
      } else {
        // Load specific assigned templates
        const { data: templates } = await supabase
          .from('maintenance_report_templates')
          .select('*')
          .in('id', templateIds);

        setAssignedTemplates(templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setAssignedTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  if (!job) return null;

  const customerName = job.customers?.name || 'Unknown Customer';
  const contactName = job.customer_contacts 
    ? `${job.customer_contacts.first_name} ${job.customer_contacts.last_name}${job.customer_contacts.title ? ` (${job.customer_contacts.title})` : ''}`
    : null;
  const contactPhone = job.customer_contacts?.phone;
  const contactEmail = job.customer_contacts?.email;
  const statusInfo = getDualJobStatusInfo(job);
  const hasServiceTemplates = assignedTemplates.length > 0;
  const canReverseJob = job.status === 'in-progress' || job.status === 'completed';

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'in-progress' && hasServiceTemplates) {
      // If job has service templates, show service report form instead of just updating status
      setShowServiceReport(true);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: newStatus,
          ...(newStatus === 'completed' ? { actual_completion_time: new Date().toISOString() } : {})
        })
        .eq('id', job.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Job status changed to ${newStatus}`,
      });
      onStatusUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReverseJob = async () => {
    const newStatus = job.status === 'completed' ? 'in-progress' : 'assigned';
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', job.id);

      if (error) throw error;

      toast({
        title: "Status Reversed",
        description: `Job status changed to ${newStatus}`,
      });
      onStatusUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reverse job status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleServiceReportComplete = () => {
    setShowServiceReport(false);
    onStatusUpdate(); // Refresh job data
  };

  const handleAddNotes = async () => {
    if (!notes.trim()) return;
    
    try {
      // TODO: Implement notes API call
      toast({
        title: "Notes Added",
        description: "Job notes have been saved",
      });
      setNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    }
  };

  const handleCall = () => {
    const phoneNumber = contactPhone || ''; // Use contact phone if available
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      toast({
        title: "No Phone Number",
        description: "No contact phone number available",
        variant: "destructive",
      });
    }
  };

  const handleNavigate = () => {
    // TODO: Implement navigation functionality
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerName)}`;
    window.open(url, '_blank');
  };

  const handleSendMessage = () => {
    const phoneNumber = contactPhone || '';
    if (phoneNumber) {
      window.open(`sms:${phoneNumber}?body=Hello, this is your driver from PortaPro. I'm on my way to your location.`, '_self');
    } else {
      toast({
        title: "No Phone Number", 
        description: "No contact phone number available",
        variant: "destructive",
      });
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="h-[100vh] fixed inset-x-0 bottom-0 z-50 mt-0 flex flex-col rounded-t-[10px] border bg-background">
        <div className="mx-auto w-full max-w-md flex flex-col h-full">
          <DrawerHeader className="flex-shrink-0 pb-4">
            <DrawerTitle className="flex items-center justify-between text-lg font-semibold">
              <span>{job.job_number}</span>
              <div className="flex flex-col gap-1">
                <Badge className={`${statusInfo.primary.gradient} text-white border-0 font-medium px-3 py-1 rounded-full`}>
                  {statusInfo.primary.label}
                </Badge>
                {statusInfo.secondary && (
                  <Badge className={`${statusInfo.secondary.gradient} text-white border-0 font-medium px-3 py-1 rounded-full text-xs`}>
                    {statusInfo.secondary.label}
                  </Badge>
                )}
              </div>
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-4">
              
              {/* Priority Status Badge */}
              {job.is_priority && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Priority Job</span>
                  </div>
                </div>
              )}

              {/* Schedule Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-sm">{format(new Date(job.scheduled_date), 'EEEE, MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Time</label>
                      <p className="text-sm">{job.scheduled_time || 'Any time'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Job Type</label>
                    <p className="text-sm capitalize">{job.job_type}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Driver</label>
                    <p className="text-sm">
                      {job.driver ? `${job.driver.first_name} ${job.driver.last_name}` : 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
                    <p className="text-sm">
                      {job.vehicle ? `${job.vehicle.license_plate} (${job.vehicle.vehicle_type})` : 'Unassigned'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building className="w-4 h-4" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                    <p className="text-sm font-medium">{customerName}</p>
                  </div>
                  {(job.customers?.email || job.customers?.phone) && (
                    <div className="grid grid-cols-2 gap-4">
                      {job.customers?.email && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p className="text-sm">{job.customers.email}</p>
                        </div>
                      )}
                      {job.customers?.phone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-sm">{job.customers.phone}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="w-4 h-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Primary Contact from customer_contacts */}
                  {contactName && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
                        <p className="text-sm font-medium">{contactName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {contactPhone && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-sm">{contactPhone}</p>
                          </div>
                        )}
                        {contactEmail && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-sm">{contactEmail}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Contacts */}
                  {job.customers?.customer_contacts && job.customers.customer_contacts.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Additional Contacts</label>
                      {job.customers.customer_contacts.map((contact, index) => (
                        <div key={contact.id} className="border rounded-lg p-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{contact.first_name} {contact.last_name}</p>
                            {contact.is_primary && (
                              <Badge variant="secondary" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          {contact.title && (
                            <p className="text-xs text-muted-foreground">{contact.title}</p>
                          )}
                          <div className="flex gap-4">
                            {contact.phone && (
                              <p className="text-xs text-muted-foreground">{contact.phone}</p>
                            )}
                            {contact.email && (
                              <p className="text-xs text-muted-foreground">{contact.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Contact Actions */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleCall}
                        className="flex-1"
                        disabled={!contactPhone}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleSendMessage}
                        className="flex-1"
                        disabled={!contactPhone}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Location Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4" />
                    Service Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.customers?.customer_service_locations && job.customers.customer_service_locations.length > 0 ? (
                    job.customers.customer_service_locations
                      .filter(location => location.is_default)
                      .concat(job.customers.customer_service_locations.filter(location => !location.is_default))
                      .slice(0, 1) // Show primary location
                      .map((location) => (
                        <div key={location.id} className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Location</label>
                            <p className="text-sm font-medium">{location.location_name}</p>
                            {location.is_default && (
                              <Badge variant="secondary" className="text-xs mt-1">Default Location</Badge>
                            )}
                          </div>
                          
                          {(location.street || location.city) && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Address</label>
                              <p className="text-sm">
                                {location.street}
                                {location.street2 && `, ${location.street2}`}
                                {location.city && (
                                  <br />
                                )}
                                {location.city && `${location.city}`}
                                {location.state && `, ${location.state}`}
                                {location.zip && ` ${location.zip}`}
                              </p>
                            </div>
                          )}
                          
                          {location.contact_person && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Site Contact</label>
                              <p className="text-sm">{location.contact_person}</p>
                              {location.contact_phone && (
                                <p className="text-xs text-muted-foreground">{location.contact_phone}</p>
                              )}
                            </div>
                          )}
                          
                          {location.access_instructions && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Access Instructions</label>
                              <p className="text-sm bg-blue-50 p-2 rounded border border-blue-200">{location.access_instructions}</p>
                            </div>
                          )}
                          
                          {location.notes && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Location Notes</label>
                              <p className="text-sm bg-gray-50 p-2 rounded">{location.notes}</p>
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No service location details available</p>
                  )}
                  
                  <div className="pt-2 border-t">
                    <Button 
                      size="sm" 
                      onClick={handleNavigate}
                      className="w-full"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Navigate to Location
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              {job.special_instructions && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Info className="w-4 h-4" />
                      Special Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm bg-amber-50 p-3 rounded border border-amber-200">{job.special_instructions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Lock Options */}
              {(job.locks_requested || job.zip_tied_on_dropoff) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Key className="w-4 h-4" />
                      Lock Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Locks Requested:</span>
                      <span className="text-sm">{job.locks_requested ? 'Yes' : 'No'}</span>
                    </div>
                    {job.locks_requested && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Number of Locks:</span>
                        <span className="text-sm">{job.locks_count || 1}</span>
                      </div>
                    )}
                    {job.lock_notes && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Lock Details:</span>
                        <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{job.lock_notes}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Zip-Tied on Drop-off:</span>
                      <span className="text-sm">{job.zip_tied_on_dropoff ? 'Yes' : 'No'}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Update Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="w-4 h-4" />
                    Update Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col space-y-2">
                    {job.status === 'assigned' && (
                      <>
                        {hasServiceTemplates ? (
                          <Button 
                            onClick={() => setShowServiceReport(true)}
                            disabled={isUpdating || loadingTemplates}
                            className="w-full"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {loadingTemplates ? 'Loading...' : 'Start Service Report'}
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleStatusUpdate('in-progress')}
                            disabled={isUpdating}
                            className="w-full"
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Job
                          </Button>
                        )}
                      </>
                    )}
                    
                    {job.status === 'in-progress' && (
                      <>
                        {hasServiceTemplates ? (
                          <Button 
                            onClick={() => setShowServiceReport(true)}
                            disabled={loadingTemplates}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {loadingTemplates ? 'Loading...' : 'Complete Service Report'}
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleStatusUpdate('completed')}
                            disabled={isUpdating}
                            className="w-full"
                            variant="default"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Reverse Status Button */}
                  {canReverseJob && (
                    <Button 
                      onClick={handleReverseJob}
                      disabled={isUpdating}
                      variant="outline"
                      className="w-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reverse Status
                    </Button>
                  )}
                  
                  {hasServiceTemplates && (
                    <p className="text-xs text-muted-foreground">
                      {assignedTemplates.length} service template(s) assigned
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Documentation Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Camera className="w-4 h-4" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowPhotoCapture(true)}
                      className="w-full"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Add Photo
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => setShowSignature(true)}
                      className="w-full"
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      Signature
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4" />
                    Add Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Add job notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddNotes}
                    disabled={!notes.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    Save Notes
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Notes */}
              {job.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4" />
                      Existing Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm bg-gray-50 p-3 rounded">{job.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Close Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Capture Modal */}
        <PhotoCapture 
          open={showPhotoCapture}
          onClose={() => setShowPhotoCapture(false)}
          jobId={job.id}
        />

        {/* Signature Capture Modal */}
        <SignatureCapture 
          open={showSignature}
          onClose={() => setShowSignature(false)}
          jobId={job.id}
        />

        {/* Service Report Form Modal */}
        <ServiceReportForm
          open={showServiceReport}
          onClose={() => setShowServiceReport(false)}
          onComplete={handleServiceReportComplete}
          job={job}
          templates={assignedTemplates}
        />
      </DrawerContent>
    </Drawer>
  );
};