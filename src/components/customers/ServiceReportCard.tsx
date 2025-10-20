import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronRight, MoreVertical, Eye, Edit, Download, Send, Trash2, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ServiceReportCardProps {
  report: {
    id: string;
    report_number: string;
    completion_percentage: number;
    created_at: string;
    completed_at: string | null;
    assigned_technician: string | null;
    jobs: {
      job_number: string;
      job_type: string;
      scheduled_date: string;
    } | null;
    maintenance_report_templates: {
      name: string;
      template_type: string;
    } | null;
  };
}

const JOB_TYPES = {
  delivery: { label: 'Delivery', icon: '📦', color: 'bg-blue-500' },
  pickup: { label: 'Pickup', icon: '🚚', color: 'bg-purple-500' },
  service: { label: 'Service', icon: '🔧', color: 'bg-orange-500' },
  return: { label: 'Return', icon: '↩️', color: 'bg-teal-500' },
};

export function ServiceReportCard({ report }: ServiceReportCardProps) {
  const getStatusBadge = (percentage: number) => {
    if (percentage === 100) {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-medium whitespace-nowrap">
          Completed
        </Badge>
      );
    } else if (percentage > 0) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium whitespace-nowrap">
          In Progress
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="whitespace-nowrap">
          Draft
        </Badge>
      );
    }
  };

  const jobType = report.jobs?.job_type 
    ? JOB_TYPES[report.jobs.job_type as keyof typeof JOB_TYPES] 
    : null;

  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow">
      {/* Header Row - Status Badge and Menu */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {getStatusBadge(report.completion_percentage)}
          {report.completion_percentage > 0 && report.completion_percentage < 100 && (
            <span className="text-sm text-muted-foreground">({report.completion_percentage}%)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Report
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Send className="w-4 h-4 mr-2" />
                Send Report
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Report Number */}
      <div className="mb-3">
        <p className="font-mono text-sm font-semibold">{report.report_number}</p>
      </div>

      {/* Job Reference */}
      {report.jobs && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">Job:</span>
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {report.jobs.job_number}
          </span>
          {jobType && (
            <Badge className={`text-white text-sm whitespace-nowrap ${jobType.color}`}>
              <span className="mr-1">{jobType.icon}</span>
              {jobType.label}
            </Badge>
          )}
        </div>
      )}

      {/* Date */}
      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(report.created_at), 'MMM d, yyyy')}</span>
        </div>
        {report.completed_at && (
          <p className="text-sm text-muted-foreground mt-1">
            Completed: {format(new Date(report.completed_at), 'MMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Template & Technician */}
      {(report.maintenance_report_templates?.name || report.assigned_technician) && (
        <div className="mb-3 space-y-1">
          {report.maintenance_report_templates?.name && (
            <p className="text-sm text-muted-foreground">
              Template: {report.maintenance_report_templates.name}
            </p>
          )}
          {report.assigned_technician && (
            <p className="text-sm text-muted-foreground">
              Technician: {report.assigned_technician}
            </p>
          )}
        </div>
      )}

      {/* Progress Bar (for incomplete reports) */}
      {report.completion_percentage < 100 && (
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{report.completion_percentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
              style={{ width: `${report.completion_percentage}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
