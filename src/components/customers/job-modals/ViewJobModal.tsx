import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, User, Truck, MapPin, DollarSign, FileText, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ViewJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
}

const JOB_STATUSES = {
  assigned: { label: 'Assigned', gradient: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  unassigned: { label: 'Unassigned', gradient: 'bg-gradient-to-r from-gray-500 to-gray-600' },
  in_progress: { label: 'In Progress', gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
  completed: { label: 'Completed', gradient: 'bg-gradient-to-r from-green-500 to-green-600' },
  cancelled: { label: 'Cancelled', gradient: 'bg-gradient-to-r from-red-500 to-red-600' },
} as const;

const JOB_TYPES = {
  delivery: { label: 'Delivery', icon: '📦' },
  pickup: { label: 'Pickup', icon: '🚚' },
  service: { label: 'Service', icon: '🪣' },
  return: { label: 'Partial Pickup', icon: '↩️' },
} as const;

export function ViewJobModal({ open, onOpenChange, job }: ViewJobModalProps) {
  if (!job) return null;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <span>{JOB_TYPES[job.job_type as keyof typeof JOB_TYPES]?.icon || '📋'}</span>
            Job Details: {job.job_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Status and Type */}
          <div className="flex items-center gap-3">
            <Badge 
              className={`text-white font-bold ${JOB_STATUSES[job.status as keyof typeof JOB_STATUSES]?.gradient || 'bg-gradient-to-r from-gray-500 to-gray-600'}`}
            >
              {JOB_STATUSES[job.status as keyof typeof JOB_STATUSES]?.label || job.status}
            </Badge>
            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold">
              {JOB_TYPES[job.job_type as keyof typeof JOB_TYPES]?.label || job.job_type}
            </Badge>
          </div>

          <Separator />

          {/* Schedule Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                <p className="font-medium">
                  {format(new Date(job.scheduled_date), 'MMMM d, yyyy')}
                </p>
              </div>
              {job.scheduled_time && (
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Time</p>
                  <p className="font-medium">{job.scheduled_time}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Assignment Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Assignment
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <p className="text-sm text-muted-foreground">Driver</p>
                <p className="font-medium">
                  {job.profiles 
                    ? `${job.profiles.first_name} ${job.profiles.last_name}`
                    : 'Unassigned'
                  }
                </p>
              </div>
              {job.vehicles && (
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{job.vehicles.license_plate}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Location Information */}
          {job.service_location && (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Service Location
                </h3>
                <div className="pl-7">
                  <p className="font-medium">{job.service_location}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Pricing
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="font-medium text-lg">{formatCurrency(job.total_price)}</p>
              </div>
            </div>
          </div>

          {/* Service Reports */}
          {job.maintenance_reports && job.maintenance_reports.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Service Reports
                </h3>
                <div className="pl-7 space-y-2">
                  {job.maintenance_reports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{report.report_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.completion_percentage}% Complete
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                        View Report
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {job.notes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Notes</h3>
                <p className="pl-7 text-muted-foreground">{job.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
