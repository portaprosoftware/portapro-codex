
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Clock, Edit, Users, CheckCircle } from "lucide-react";
import { EditDriverHoursModal } from "./EditDriverHoursModal";
import { useDriversWithHours } from "@/hooks/useDriverWorkingHours";

interface DriverWorkingHoursSectionProps {
  onBack: () => void;
}

export function DriverWorkingHoursSection({ onBack }: DriverWorkingHoursSectionProps) {
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [editingDriver, setEditingDriver] = useState<string | null>(null);

  const { data: drivers, isLoading } = useDriversWithHours();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDrivers(drivers?.map(d => d.id) || []);
    } else {
      setSelectedDrivers([]);
    }
  };

  const handleDriverSelect = (driverId: string, checked: boolean) => {
    if (checked) {
      setSelectedDrivers(prev => [...prev, driverId]);
    } else {
      setSelectedDrivers(prev => prev.filter(id => id !== driverId));
    }
  };

  const getDriverStatus = (driver: any) => {
    const workingHours = driver.working_hours || [];
    if (!workingHours || workingHours.length === 0) {
      return { text: "No Hours Set", variant: "destructive" as const };
    }
    
    const activeDays = workingHours.filter((h: any) => h.is_active).length;
    return { 
      text: `Hours Set (${activeDays} days)`, 
      variant: "default" as const 
    };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Settings
        </Button>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Driver Working Hours</h1>
          <p className="text-muted-foreground text-sm">Manage driver schedules and working hours</p>
        </div>
      </div>

      {/* Quick Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Quick Setup Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">1</div>
              <div>
                <p className="font-medium">Select Drivers</p>
                <p className="text-muted-foreground">Choose drivers to configure hours for</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">2</div>
              <div>
                <p className="font-medium">Set Working Hours</p>
                <p className="text-muted-foreground">Configure daily schedules and availability</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">3</div>
              <div>
                <p className="font-medium">Save & Apply</p>
                <p className="text-muted-foreground">Review and save the schedule changes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Drivers ({drivers?.length || 0})</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedDrivers.length === drivers?.length && drivers.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {drivers?.map((driver) => {
              const status = getDriverStatus(driver);
              return (
                <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedDrivers.includes(driver.id)}
                      onCheckedChange={(checked) => handleDriverSelect(driver.id, checked as boolean)}
                    />
                    <div>
                      <p className="font-medium">{driver.first_name} {driver.last_name}</p>
                      <Badge variant={status.variant} className="mt-1">
                        {status.text}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingDriver(driver.id)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Hours
                  </Button>
                </div>
              );
            })}
            
            {drivers?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No drivers found</p>
                <p className="text-sm">Add drivers to your team to manage their working hours</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedDrivers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedDrivers.length} driver{selectedDrivers.length !== 1 ? 's' : ''} selected
              </p>
              <div className="space-x-2">
                <Button variant="outline" size="sm">
                  Apply Template
                </Button>
                <Button variant="outline" size="sm">
                  Bulk Edit Hours
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Driver Hours Modal */}
      {editingDriver && (
        <EditDriverHoursModal
          driverId={editingDriver}
          onClose={() => setEditingDriver(null)}
        />
      )}
    </div>
  );
}
