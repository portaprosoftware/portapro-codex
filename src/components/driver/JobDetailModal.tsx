import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  MessageSquare
} from 'lucide-react';
import { PhotoCapture } from './PhotoCapture';
import { SignatureCapture } from './SignatureCapture';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
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

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

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
  const [isUpdating, setIsUpdating] = useState(false);

  if (!job) return null;

  const customerName = job.customers?.name || 'Unknown Customer';

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      // TODO: Implement status update API call
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{job.job_number}</span>
            <Badge className={statusColors[job.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
              {job.status.replace(/-/g, ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

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
                <Button 
                  onClick={() => handleStatusUpdate('in-progress')}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Job
                </Button>
              )}
              
              {job.status === 'in-progress' && (
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
            </div>
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
      </DialogContent>
    </Dialog>
  );
};