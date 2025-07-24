import React, { useState, useEffect } from 'react';
import { Briefcase, Truck, Package, Wrench, MapPin, Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { getTimezoneFromZip, getCompanyTimezone, timezoneOptions, formatTimezoneLabel } from '@/lib/timezoneUtils';

interface JobTypeTimezoneStepProps {
  data: {
    jobType: 'delivery' | 'pickup' | 'service' | 'estimate' | null;
    timezone: string;
    customerZip?: string;
    customerState?: string;
  };
  onUpdate: (data: { 
    jobType: 'delivery' | 'pickup' | 'service' | 'estimate' | null; 
    timezone: string;
    customerZip?: string;
    customerState?: string;
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
    id: 'estimate' as const,
    name: 'On-Site Survey/Estimate',
    description: 'Site visit for assessment and estimation',
    icon: MapPin,
    color: 'purple',
  },
];

export const JobTypeTimezoneStep: React.FC<JobTypeTimezoneStepProps> = ({ 
  data, 
  onUpdate,
  allowEarlyPickup = false 
}) => {
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);
  const companyTimezone = getCompanyTimezone();

  useEffect(() => {
    if (data.customerZip) {
      const detected = getTimezoneFromZip(data.customerZip, data.customerState);
      setDetectedTimezone(detected);
      
      // Auto-set timezone if not already set
      if (!data.timezone || data.timezone === companyTimezone) {
        onUpdate({ ...data, timezone: detected });
      }
    }
  }, [data.customerZip, data.customerState]);

  const handleJobTypeSelect = (jobType: 'delivery' | 'pickup' | 'service' | 'estimate') => {
    onUpdate({ ...data, jobType });
  };

  const handleTimezoneSelect = (timezone: string) => {
    onUpdate({ ...data, timezone });
  };

  const isTimezoneDetected = detectedTimezone && detectedTimezone !== companyTimezone;
  const isCustomerTimezoneSelected = data.timezone === detectedTimezone;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Job Type & Timezone</h2>
        <p className="text-muted-foreground">What type of job are you scheduling and in which timezone?</p>
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

      {/* Timezone Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Schedule Timezone</Label>
        
        {/* Timezone Detection Info */}
        {isTimezoneDetected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Customer Timezone Detected
              </span>
            </div>
            <div className="text-xs text-blue-700">
              Based on ZIP {data.customerZip}: {formatTimezoneLabel(detectedTimezone)}
              {isCustomerTimezoneSelected && (
                <Badge className="ml-2 bg-blue-100 text-blue-800">Same</Badge>
              )}
            </div>
          </div>
        )}

        <Select value={data.timezone} onValueChange={handleTimezoneSelect}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select timezone">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatTimezoneLabel(data.timezone)}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {/* Company timezone first */}
            <SelectItem value={companyTimezone}>
              <div className="flex items-center justify-between w-full">
                <span>{formatTimezoneLabel(companyTimezone)}</span>
                <Badge className="ml-2 bg-green-100 text-green-800">Company</Badge>
              </div>
            </SelectItem>
            
            {/* Customer timezone if different */}
            {detectedTimezone && detectedTimezone !== companyTimezone && (
              <SelectItem value={detectedTimezone}>
                <div className="flex items-center justify-between w-full">
                  <span>{formatTimezoneLabel(detectedTimezone)}</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800">Customer</Badge>
                </div>
              </SelectItem>
            )}
            
            {/* All other timezones */}
            {timezoneOptions
              .filter(tz => tz.value !== companyTimezone && tz.value !== detectedTimezone)
              .map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selection Summary */}
      {data.jobType && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-sm font-medium text-primary">
              Job Configuration
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Type:</span>{' '}
              <span className="font-medium">
                {jobTypes.find(jt => jt.id === data.jobType)?.name}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Timezone:</span>{' '}
              <span className="font-medium">
                {formatTimezoneLabel(data.timezone)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};