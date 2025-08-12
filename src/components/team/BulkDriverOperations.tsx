import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Send, FileText, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CSVImportModal } from './CSVImportModal';
import { ComplianceExportModal } from './ComplianceExportModal';

interface Driver {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

export function BulkDriverOperations() {
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch drivers
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers-bulk'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          status,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'driver');
      
      if (error) throw error;
      return data.map(driver => ({
        id: driver.id,
        email: driver.email || '',
        firstName: driver.first_name || '',
        lastName: driver.last_name || '',
        role: 'driver',
        status: driver.status || 'active'
      }));
    }
  });

  // Bulk reminder mutation
  const bulkReminderMutation = useMutation({
    mutationFn: async ({ driverIds, message }: { driverIds: string[], message: string }) => {
      const { data, error } = await supabase.functions.invoke('send-bulk-reminders', {
        body: { driverIds, message, type: 'manual' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Reminders Sent",
        description: `Sent reminders to ${selectedDrivers.length} drivers successfully.`
      });
      setSelectedDrivers([]);
      setReminderMessage('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send bulk reminders. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ driverIds, status }: { driverIds: string[], status: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .in('id', driverIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: `Updated status for ${selectedDrivers.length} drivers successfully.`
      });
      setSelectedDrivers([]);
      setStatusUpdate('');
      queryClient.invalidateQueries({ queryKey: ['drivers-bulk'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update driver status. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDriverSelection = (driverId: string, checked: boolean) => {
    if (checked) {
      setSelectedDrivers(prev => [...prev, driverId]);
    } else {
      setSelectedDrivers(prev => prev.filter(id => id !== driverId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDrivers(drivers.map(d => d.id));
    } else {
      setSelectedDrivers([]);
    }
  };

  const handleBulkAction = () => {
    if (selectedDrivers.length === 0) {
      toast({
        title: "No Drivers Selected",
        description: "Please select at least one driver to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    switch (bulkAction) {
      case 'send_reminders':
        if (!reminderMessage.trim()) {
          toast({
            title: "Message Required",
            description: "Please enter a reminder message.",
            variant: "destructive"
          });
          return;
        }
        bulkReminderMutation.mutate({ driverIds: selectedDrivers, message: reminderMessage });
        break;
      case 'update_status':
        if (!statusUpdate) {
          toast({
            title: "Status Required",
            description: "Please select a status to update.",
            variant: "destructive"
          });
          return;
        }
        bulkStatusMutation.mutate({ driverIds: selectedDrivers, status: statusUpdate });
        break;
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = `firstName,lastName,email,phone,licenseNumber,licenseState,licenseClass,licenseExpiryDate,medicalCardExpiryDate,trainingType,trainingCompletedDate
John,Doe,john.doe@example.com,555-0123,D123456789,CA,CDL-A,2025-12-31,2025-06-30,Safety Training,2024-01-15
Jane,Smith,jane.smith@example.com,555-0124,D987654321,CA,CDL-B,2025-11-30,2025-05-31,Defensive Driving,2024-02-20`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'driver_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bulk Driver Operations</h2>
          <p className="text-muted-foreground">
            Manage multiple drivers efficiently with bulk operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadCSVTemplate}>
            <Download className="h-4 w-4 mr-2" />
            CSV Template
          </Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Drivers
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Export Compliance
          </Button>
        </div>
      </div>

      <Tabs defaultValue="driver-list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="driver-list">Driver Selection</TabsTrigger>
          <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bulk Operations
              </CardTitle>
              <CardDescription>
                Perform actions on multiple drivers at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {selectedDrivers.length} drivers selected
                </Badge>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_reminders">Send Reminders</SelectItem>
                    <SelectItem value="update_status">Update Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bulkAction === 'send_reminders' && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-message">Reminder Message</Label>
                  <Textarea
                    id="reminder-message"
                    placeholder="Enter your reminder message here..."
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {bulkAction === 'update_status' && (
                <div className="space-y-2">
                  <Label htmlFor="status-update">New Status</Label>
                  <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="training">In Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                onClick={handleBulkAction}
                disabled={!bulkAction || selectedDrivers.length === 0 || bulkReminderMutation.isPending || bulkStatusMutation.isPending}
                className="w-full"
              >
                {bulkReminderMutation.isPending || bulkStatusMutation.isPending ? (
                  "Processing..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Execute Action
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="driver-list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Driver Selection</CardTitle>
              <CardDescription>
                Select drivers for bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedDrivers.length === drivers.length && drivers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>Select All ({drivers.length} drivers)</Label>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedDrivers.includes(driver.id)}
                        onCheckedChange={(checked) => handleDriverSelection(driver.id, !!checked)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {driver.firstName} {driver.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {driver.email}
                        </div>
                      </div>
                      <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                        {driver.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CSVImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['drivers-bulk'] })}
      />
      
      <ComplianceExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}