import React, { useState } from 'react';
import { Briefcase, Truck, Package, Wrench, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface JobTypeTimezoneStepProps {
  data: {
    jobType: 'delivery' | 'pickup' | 'service' | 'partial-pickup' | 'on-site-survey' | null;
    timezone: string;
    selectedCustomer?: any;
  };
  onUpdate: (data: { 
    jobType: 'delivery' | 'pickup' | 'service' | 'partial-pickup' | 'on-site-survey' | null; 
    timezone: string;
  }) => void;
  allowEarlyPickup?: boolean;
}

const jobTypes = [
  {
    id: 'delivery' as const,
    name: 'Delivery',
    description: 'Deliver equipment to customer location',
    icon: Truck,
    color: 'blue',
  },
  {
    id: 'pickup' as const,
    name: 'Pickup',
    description: 'Pick up equipment from customer location', 
    icon: Package,
    color: 'green',
  },
  {
    id: 'service' as const,
    name: 'Service-Only',
    description: 'Service existing equipment on-site',
    icon: Wrench,
    color: 'orange',
  },
  {
    id: 'on-site-survey' as const,
    name: 'On-Site Survey/Estimate',
    description: 'Site visit for assessment and estimation',
    icon: MapPin,
    color: 'blue',
  },
];

export const JobTypeTimezoneStep: React.FC<JobTypeTimezoneStepProps> = ({ 
  data, 
  onUpdate,
  allowEarlyPickup = false 
}) => {
  // Default timezone - simplified, no database queries
  const companyTimezone = 'America/New_York';

  const handleJobTypeSelect = (jobType: 'delivery' | 'pickup' | 'service' | 'partial-pickup' | 'on-site-survey') => {
    onUpdate({ ...data, jobType });
  };

  const handleTimezoneSelect = (timezone: string) => {
    onUpdate({ ...data, timezone });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Job Type</h2>
        <p className="text-muted-foreground">What type of job are you scheduling?</p>
      </div>

      {/* Job Type Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Job Type</Label>
        <div className="grid gap-3">
          {jobTypes.map((jobType) => {
            const Icon = jobType.icon;
            const isSelected = data.jobType === jobType.id;
            
            return (
              <div
                key={jobType.id}
                className={cn(
                  "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "border-primary bg-gradient-to-r from-primary/10 to-primary/20 shadow-md"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => handleJobTypeSelect(jobType.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isSelected
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-semibold",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {jobType.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {jobType.description}
                    </p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Early Pickup Option - only show when scheduling delivery with multiple dates */}
          {allowEarlyPickup && data.jobType === 'delivery' && (
            <div className="border-2 border-dashed border-muted rounded-xl p-4 bg-muted/20">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Early Pickup</h3>
                  <p className="text-muted-foreground text-sm">
                    Available after setting delivery with multiple pickup dates
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Auto-Added
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Selection Summary */}
      {data.jobType && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-sm font-medium text-primary">
              Selected Job Type
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">
              {jobTypes.find(jt => jt.id === data.jobType)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};