import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, CheckCircle, Trash2, MoreHorizontal } from 'lucide-react';

interface BulkActionsBarProps {
  selectedJobsCount: number;
  drivers: any[];
  onAssignToDriver: (driverId: string) => void;
  onMarkCompleted: () => void;
  onMarkCancelled: () => void;
  onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedJobsCount,
  drivers,
  onAssignToDriver,
  onMarkCompleted,
  onMarkCancelled,
  onClearSelection
}) => {
  if (selectedJobsCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedJobsCount} job{selectedJobsCount > 1 ? 's' : ''} selected
        </span>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <Select onValueChange={onAssignToDriver}>
            <SelectTrigger className="w-48 h-8">
              <SelectValue placeholder="Assign to driver..." />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-3 w-3" />
                    {driver.first_name} {driver.last_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button size="sm" variant="outline" onClick={onMarkCompleted}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Mark Completed
          </Button>
          
          <Button size="sm" variant="outline" onClick={onMarkCancelled}>
            <Trash2 className="h-3 w-3 mr-1" />
            Cancel Jobs
          </Button>
        </div>
      </div>
      
      <Button size="sm" variant="ghost" onClick={onClearSelection}>
        Clear Selection
      </Button>
    </div>
  );
};