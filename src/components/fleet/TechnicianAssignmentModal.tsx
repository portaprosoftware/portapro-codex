import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, User, Wrench } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TechnicianAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenanceRecordId: string | null;
  currentTechnicianId?: string;
}

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  specialties: string[];
  availability_status: 'available' | 'busy' | 'off_duty';
  current_workload: number;
}

export function TechnicianAssignmentModal({
  open,
  onOpenChange,
  maintenanceRecordId,
  currentTechnicianId
}: TechnicianAssignmentModalProps) {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(currentTechnicianId || "");
  const queryClient = useQueryClient();

  // Fetch available technicians
  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          user_roles!inner(role)
        `)
        .in('user_roles.role', ['driver', 'admin'])
        .eq('is_active', true);

      if (error) throw error;

      // Mock additional technician data for demo
      return data.map(tech => ({
        id: tech.id,
        first_name: tech.first_name || 'Unknown',
        last_name: tech.last_name || 'Technician',
        specialties: ['General Maintenance', 'Engine Work'],
        availability_status: Math.random() > 0.3 ? 'available' : 'busy' as 'available' | 'busy',
        current_workload: Math.floor(Math.random() * 5)
      }));
    },
    enabled: open
  });

  // Assign technician mutation
  const assignTechnicianMutation = useMutation({
    mutationFn: async ({ recordId, technicianId }: { recordId: string; technicianId: string }) => {
      const { error } = await supabase
        .from('maintenance_records')
        .update({ technician_id: technicianId })
        .eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Technician assigned successfully");
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to assign technician: ${error.message}`);
    }
  });

  const handleAssign = () => {
    if (!maintenanceRecordId || !selectedTechnicianId) return;
    
    assignTechnicianMutation.mutate({
      recordId: maintenanceRecordId,
      technicianId: selectedTechnicianId
    });
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'off_duty': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Assign Technician
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignment */}
          {currentTechnicianId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <User className="w-4 h-4" />
                <span className="font-medium">Currently Assigned Technician</span>
              </div>
              <p className="text-blue-700 mt-1">
                {technicians.find(t => t.id === currentTechnicianId)?.first_name} {technicians.find(t => t.id === currentTechnicianId)?.last_name}
              </p>
            </div>
          )}

          {/* Technician Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Select Technician
            </label>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {technicians.map((technician) => (
                  <div
                    key={technician.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTechnicianId === technician.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTechnicianId(technician.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {technician.first_name?.[0]}{technician.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="font-medium text-gray-900">
                            {technician.first_name} {technician.last_name}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            Workload: {technician.current_workload} active tasks
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={getAvailabilityColor(technician.availability_status)}>
                          {technician.availability_status.replace('_', ' ')}
                        </Badge>
                        
                        <div className="flex gap-1">
                          {technician.specialties.slice(0, 2).map((specialty, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedTechnicianId || assignTechnicianMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {assignTechnicianMutation.isPending ? "Assigning..." : "Assign Technician"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}