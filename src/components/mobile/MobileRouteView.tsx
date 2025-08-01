import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PadlockStatusIcon } from '@/components/inventory/PadlockStatusIcon';
import { MapPin, Clock, Key, AlertTriangle, Navigation } from 'lucide-react';

interface RouteJob {
  id: string;
  customer_name: string;
  address: string;
  scheduled_time: string;
  job_type: string;
  status: string;
  items: Array<{
    id: string;
    item_code: string;
    product_name: string;
    currently_padlocked: boolean;
    padlock_type?: string;
    supports_padlock: boolean;
  }>;
}

interface MobileRouteViewProps {
  jobs: RouteJob[];
  currentDate: string;
  onJobSelect?: (jobId: string) => void;
  onNavigate?: (address: string) => void;
}

export const MobileRouteView: React.FC<MobileRouteViewProps> = ({
  jobs,
  currentDate,
  onJobSelect,
  onNavigate
}) => {
  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'assigned': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return '📦';
      case 'pickup': return '🚚';
      case 'service': return '🔧';
      case 'cleaning': return '🧽';
      default: return '📋';
    }
  };

  const getJobPadlockSummary = (items: RouteJob['items']) => {
    const padlockSupported = items.filter(item => item.supports_padlock);
    const padlocked = padlockSupported.filter(item => item.currently_padlocked);
    const needsKey = padlocked.filter(item => item.padlock_type === 'keyed');
    const needsCombination = padlocked.filter(item => item.padlock_type === 'combination');

    return {
      total: padlockSupported.length,
      padlocked: padlocked.length,
      needsKey: needsKey.length,
      needsCombination: needsCombination.length
    };
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    // Sort by scheduled time
    return new Date(`${currentDate} ${a.scheduled_time}`).getTime() - 
           new Date(`${currentDate} ${b.scheduled_time}`).getTime();
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Today's Route - {new Date(currentDate).toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">{jobs.length}</div>
              <div className="text-muted-foreground">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="font-medium">
                {jobs.filter(job => job.status === 'completed').length}
              </div>
              <div className="text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-medium">
                {jobs.reduce((acc, job) => {
                  const summary = getJobPadlockSummary(job.items);
                  return acc + summary.padlocked;
                }, 0)}
              </div>
              <div className="text-muted-foreground">Locked Units</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {sortedJobs.map((job) => {
        const padlockSummary = getJobPadlockSummary(job.items);
        
        return (
          <Card key={job.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getJobTypeIcon(job.job_type)}</span>
                    <h3 className="font-medium">{job.customer_name}</h3>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs text-white ${getJobStatusColor(job.status)}`}
                    >
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">{job.scheduled_time}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Padlock Requirements */}
              {padlockSummary.total > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Padlock Requirements
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium">{padlockSummary.padlocked}</div>
                      <div className="text-muted-foreground">Locked</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{padlockSummary.needsKey}</div>
                      <div className="text-muted-foreground">Need Key</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{padlockSummary.needsCombination}</div>
                      <div className="text-muted-foreground">Need Code</div>
                    </div>
                  </div>

                  {/* Quick preview of units */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.items
                      .filter(item => item.supports_padlock)
                      .slice(0, 5)
                      .map(item => (
                        <div key={item.id} className="flex items-center gap-1">
                          <PadlockStatusIcon
                            currentlyPadlocked={item.currently_padlocked}
                            padlockType={item.padlock_type as any}
                            className="h-3 w-3"
                            showTooltip={false}
                          />
                          <span className="text-xs font-mono">{item.item_code}</span>
                        </div>
                      ))}
                    {job.items.filter(item => item.supports_padlock).length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{job.items.filter(item => item.supports_padlock).length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate?.(job.address)}
                  className="flex-1"
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
                <Button
                  size="sm"
                  onClick={() => onJobSelect?.(job.id)}
                  className="flex-1"
                >
                  Start Job
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {jobs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No jobs scheduled for today</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};