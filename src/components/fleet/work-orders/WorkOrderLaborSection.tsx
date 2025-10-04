import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Clock, Play, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WorkOrderLabor {
  id: string;
  technician_id?: string;
  technician_name?: string;
  start_time?: string;
  end_time?: string;
  hours?: number;
  hourly_rate: number;
  notes?: string;
  is_active?: boolean; // For timer tracking
}

interface WorkOrderLaborSectionProps {
  labor: WorkOrderLabor[];
  onChange: (labor: WorkOrderLabor[]) => void;
}

export const WorkOrderLaborSection: React.FC<WorkOrderLaborSectionProps> = ({
  labor,
  onChange
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update timer every second for active timers
  useEffect(() => {
    const hasActiveTimer = labor.some(l => l.is_active);
    if (!hasActiveTimer) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [labor]);

  const addLabor = () => {
    const newLabor: WorkOrderLabor = {
      id: `temp-${Date.now()}`,
      technician_name: '',
      hourly_rate: 50, // Default rate
      is_active: false
    };
    
    onChange([...labor, newLabor]);
  };

  const updateLabor = (laborId: string, updates: Partial<WorkOrderLabor>) => {
    onChange(labor.map(l => 
      l.id === laborId ? { ...l, ...updates } : l
    ));
  };

  const removeLabor = (laborId: string) => {
    onChange(labor.filter(l => l.id !== laborId));
  };

  const startTimer = (laborId: string) => {
    const now = new Date().toISOString();
    updateLabor(laborId, {
      start_time: now,
      is_active: true,
      end_time: undefined,
      hours: undefined
    });
  };

  const stopTimer = (laborId: string) => {
    const laborEntry = labor.find(l => l.id === laborId);
    if (!laborEntry?.start_time) return;

    const now = new Date();
    const start = new Date(laborEntry.start_time);
    const hoursWorked = (now.getTime() - start.getTime()) / (1000 * 60 * 60);

    updateLabor(laborId, {
      end_time: now.toISOString(),
      hours: parseFloat(hoursWorked.toFixed(2)),
      is_active: false
    });
  };

  const calculateElapsedTime = (startTime: string): number => {
    const start = new Date(startTime);
    const elapsed = (currentTime.getTime() - start.getTime()) / (1000 * 60 * 60);
    return parseFloat(elapsed.toFixed(2));
  };

  const calculateTotal = () => {
    return labor.reduce((sum, l) => {
      const hours = l.is_active && l.start_time 
        ? calculateElapsedTime(l.start_time)
        : l.hours || 0;
      return sum + (hours * l.hourly_rate);
    }, 0);
  };

  const getTotalHours = () => {
    return labor.reduce((sum, l) => {
      const hours = l.is_active && l.start_time 
        ? calculateElapsedTime(l.start_time)
        : l.hours || 0;
      return sum + hours;
    }, 0);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Labor</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getTotalHours().toFixed(2)}h
            </Badge>
            <Badge variant="outline" className="text-xs">
              ${calculateTotal().toFixed(2)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add labor button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addLabor}
          className="w-full text-xs"
          type="button"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Technician
        </Button>

        {/* Labor entries */}
        {labor.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No labor entries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {labor.map((entry) => {
              const elapsedHours = entry.is_active && entry.start_time
                ? calculateElapsedTime(entry.start_time)
                : entry.hours || 0;
              const subtotal = elapsedHours * entry.hourly_rate;

              return (
                <div key={entry.id} className="border rounded-lg p-3 space-y-3 bg-background">
                  {/* Technician name and remove */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <Input
                        value={entry.technician_name || ''}
                        onChange={(e) => updateLabor(entry.id, { technician_name: e.target.value })}
                        placeholder="Technician name"
                        className="text-sm font-medium"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLabor(entry.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Timer controls */}
                  {!entry.hours && !entry.end_time && (
                    <div className="flex gap-2">
                      {!entry.is_active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startTimer(entry.id)}
                          className="flex-1 text-xs"
                          type="button"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start Timer
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stopTimer(entry.id)}
                          className="flex-1 text-xs"
                          type="button"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Stop Timer
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Active timer display */}
                  {entry.is_active && entry.start_time && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Timer Running</div>
                      <div className="text-xl font-mono font-bold text-blue-600">
                        {elapsedHours.toFixed(2)}h
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Started {formatDistanceToNow(new Date(entry.start_time), { addSuffix: true })}
                      </div>
                    </div>
                  )}

                  {/* Manual hours or hourly rate */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`${entry.id}-hours`} className="text-xs">
                        Hours {entry.is_active ? '(Live)' : ''}
                      </Label>
                      <Input
                        id={`${entry.id}-hours`}
                        type="number"
                        min="0"
                        step="0.25"
                        value={entry.is_active ? elapsedHours.toFixed(2) : entry.hours || ''}
                        onChange={(e) => !entry.is_active && updateLabor(entry.id, { hours: parseFloat(e.target.value) || 0 })}
                        disabled={entry.is_active}
                        className="text-sm"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${entry.id}-rate`} className="text-xs">Rate/hr</Label>
                      <Input
                        id={`${entry.id}-rate`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry.hourly_rate}
                        onChange={(e) => updateLabor(entry.id, { hourly_rate: parseFloat(e.target.value) || 0 })}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <Label htmlFor={`${entry.id}-notes`} className="text-xs">Notes (optional)</Label>
                    <Textarea
                      id={`${entry.id}-notes`}
                      value={entry.notes || ''}
                      onChange={(e) => updateLabor(entry.id, { notes: e.target.value })}
                      placeholder="Work performed..."
                      className="text-sm min-h-[60px]"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="flex justify-end">
                    <Badge variant="secondary" className="text-xs">
                      Subtotal: ${subtotal.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total */}
        {labor.length > 0 && (
          <div className="pt-2 border-t flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">Labor Total</div>
              <div className="text-xs text-muted-foreground">{getTotalHours().toFixed(2)} hours</div>
            </div>
            <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
