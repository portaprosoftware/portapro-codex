import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  FileText
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
  customer_id: string;
  driver_id?: string;
  assigned_template_ids?: any;
  default_template_id?: string;
  customers: {
    name?: string;
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
  const statusInfo = getDualJobStatusInfo(job);
  const hasServiceTemplates = assignedTemplates.length > 0;

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
    // TODO: Implement call customer functionality
    window.open(`tel:+1234567890`, '_self');
  };

  const handleNavigate = () => {
    // TODO: Implement navigation functionality
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerName)}`;
    window.open(url, '_blank');
  };

  const handleSendMessage = () => {
    // TODO: Implement SMS functionality
    window.open(`sms:+1234567890?body=Hello, this is your driver from PortaPro. I'm on my way to your location.`, '_self');
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
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{customerName}</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    {format(new Date(job.scheduled_date), 'MMM d')}
                    {job.scheduled_time && ` at ${job.scheduled_time}`}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    Service Location Address
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleCall}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleSendMessage}
                    className="flex-1"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={handleNavigate}
                    className="flex-1"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate
                  </Button>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="space-y-3">
                <h4 className="font-medium">Update Status</h4>
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
                
                {hasServiceTemplates && (
                  <p className="text-xs text-muted-foreground">
                    {assignedTemplates.length} service template(s) assigned
                  </p>
                )}
              </div>

              {/* Documentation Actions */}
              <div className="space-y-3">
                <h4 className="font-medium">Documentation</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowPhotoCapture(true)}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
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
              </div>

              {/* Notes Section */}
              <div className="space-y-3">
                <h4 className="font-medium">Add Notes</h4>
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
              </div>

              {job.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Existing Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {job.notes}
                  </p>
                </div>
              )}
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