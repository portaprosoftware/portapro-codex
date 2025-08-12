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
import { Upload, Download, Send, FileText, Users, CheckCircle, MessageSquare, Calendar, IdCard, FileSpreadsheet, BarChart3 } from 'lucide-react';
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
        title: "Messages Sent",
        description: `Sent messages to ${selectedDrivers.length} drivers successfully.`
      });
      setSelectedDrivers([]);
      setReminderMessage('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send bulk messages. Please try again.",
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
      case 'send_messages':
        if (!reminderMessage.trim()) {
          toast({
            title: "Message Required",
            description: "Please enter a message.",
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
      </div>

      {/* Persistent Driver Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Driver Selection
          </CardTitle>
          <CardDescription>
            Select drivers for bulk operations ({selectedDrivers.length} selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDrivers.length === drivers.length && drivers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label>Select All ({drivers.length} drivers)</Label>
              </div>
              {selectedDrivers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDrivers([])}
                >
                  Clear Selection
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {drivers.map((driver) => (
                <div key={driver.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedDrivers.includes(driver.id)}
                    onCheckedChange={(checked) => handleDriverSelection(driver.id, !!checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {driver.firstName} {driver.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {driver.email}
                    </div>
                  </div>
                  <Badge variant={driver.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {driver.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Operations Tabs */}
      <Tabs defaultValue="communication" className="space-y-4">
        <TabsList>
          <TabsTrigger value="communication">Communication & Actions</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication & Actions
              </CardTitle>
              <CardDescription>
                Send communications and perform operational tasks on selected drivers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Send Message - Full Width Row */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  <h3 className="font-medium">Send Message</h3>
                </div>
                <Textarea
                  placeholder="Enter message..."
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={() => bulkReminderMutation.mutate({ driverIds: selectedDrivers, message: reminderMessage })}
                  disabled={!reminderMessage.trim() || selectedDrivers.length === 0 || bulkReminderMutation.isPending}
                  className="w-full"
                  size="sm"
                >
                  {bulkReminderMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Update Status */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <h3 className="font-medium">Update Status</h3>
                  </div>
                  <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => bulkStatusMutation.mutate({ driverIds: selectedDrivers, status: statusUpdate })}
                    disabled={!statusUpdate || selectedDrivers.length === 0 || bulkStatusMutation.isPending}
                    className="w-full"
                    size="sm"
                  >
                    {bulkStatusMutation.isPending ? "Updating..." : "Update Status"}
                  </Button>
                </div>

                {/* Send Documents - Placeholder */}
                <div className="space-y-4 p-4 border rounded-lg opacity-60">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <h3 className="font-medium">Send Documents</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Distribute policy updates, forms, or notices to selected drivers.
                  </p>
                  <Button disabled className="w-full" size="sm">
                    Coming Soon
                  </Button>
                </div>

                {/* Assign Training - Placeholder */}
                <div className="space-y-4 p-4 border rounded-lg opacity-60">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <h3 className="font-medium">Assign Training</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bulk assign required training courses and certifications.
                  </p>
                  <Button disabled className="w-full" size="sm">
                    Coming Soon
                  </Button>
                </div>

                {/* Schedule Shifts - Placeholder */}
                <div className="space-y-4 p-4 border rounded-lg opacity-60">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="font-medium">Schedule Shifts</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assign multiple drivers to shifts and time slots.
                  </p>
                  <Button disabled className="w-full" size="sm">
                    Coming Soon
                  </Button>
                </div>

                {/* Generate ID Cards - Placeholder */}
                <div className="space-y-4 p-4 border rounded-lg opacity-60">
                  <div className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    <h3 className="font-medium">Generate ID Cards</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create printable ID cards and access badges.
                  </p>
                  <Button disabled className="w-full" size="sm">
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Import, export, and generate reports for driver data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Import Drivers */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <h3 className="font-medium">Import Drivers</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload CSV file to import multiple driver records.
                  </p>
                  <Button 
                    onClick={() => setShowImportModal(true)}
                    className="w-full"
                    size="sm"
                  >
                    Import CSV
                  </Button>
                </div>

                {/* Export Compliance */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <h3 className="font-medium">Export Compliance</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export compliance data for regulatory reporting.
                  </p>
                  <Button 
                    onClick={() => setShowExportModal(true)}
                    className="w-full"
                    size="sm"
                  >
                    Export Data
                  </Button>
                </div>

                {/* CSV Template */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <h3 className="font-medium">CSV Template</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Download the template for importing driver data.
                  </p>
                  <Button 
                    onClick={downloadCSVTemplate}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    Download Template
                  </Button>
                </div>

                {/* Generate Reports - Placeholder */}
                <div className="space-y-4 p-4 border rounded-lg opacity-60">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <h3 className="font-medium">Generate Reports</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create bulk driver performance and compliance reports.
                  </p>
                  <Button disabled className="w-full" size="sm">
                    Coming Soon
                  </Button>
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