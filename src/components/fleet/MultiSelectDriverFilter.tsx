import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, X } from 'lucide-react';
import { useDriverDirectory } from '@/hooks/useDirectory';

interface Driver {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  clerk_user_id: string | null;
}

interface MultiSelectDriverFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDrivers: Driver[];
  onDriversChange: (drivers: Driver[]) => void;
}

export const MultiSelectDriverFilter: React.FC<MultiSelectDriverFilterProps> = ({
  open,
  onOpenChange,
  selectedDrivers,
  onDriversChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: drivers, isLoading } = useDriverDirectory();

  const getDriverDisplayName = (driver: Driver) => {
    const firstName = driver.first_name || '';
    const lastName = driver.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Driver';
  };

  const filteredDrivers = drivers?.filter((driver) => {
    const displayName = getDriverDisplayName(driver).toLowerCase();
    const email = driver.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return displayName.includes(search) || email.includes(search);
  }) || [];

  const toggleDriver = (driver: Driver) => {
    const isSelected = selectedDrivers.some(d => d.id === driver.id);
    if (isSelected) {
      onDriversChange(selectedDrivers.filter(d => d.id !== driver.id));
    } else {
      onDriversChange([...selectedDrivers, driver]);
    }
  };

  const selectAll = () => {
    onDriversChange(filteredDrivers);
  };

  const clearAll = () => {
    onDriversChange([]);
  };

  const removeDriver = (driverId: string) => {
    onDriversChange(selectedDrivers.filter(d => d.id !== driverId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Select Drivers {selectedDrivers.length > 0 && `(${selectedDrivers.length} selected)`}
          </DialogTitle>
        </DialogHeader>

        {/* Selected Drivers Summary */}
        {selectedDrivers.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
            {selectedDrivers.map((driver) => (
              <Badge key={driver.id} variant="secondary" className="px-3 py-1">
                {getDriverDisplayName(driver)}
                <button
                  onClick={() => removeDriver(driver.id)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>

        {/* Driver Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading drivers...</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No drivers found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDrivers.map((driver) => {
                const isSelected = selectedDrivers.some(d => d.id === driver.id);
                return (
                  <div
                    key={driver.id}
                    onClick={() => toggleDriver(driver)}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all
                      hover:shadow-md hover:scale-[1.02]
                      ${isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <span className="text-xs">✓</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {getDriverDisplayName(driver)}
                        </div>
                        {driver.email && (
                          <div className="text-sm text-muted-foreground truncate">
                            {driver.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedDrivers.length} of {filteredDrivers.length} drivers selected
          </div>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
