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
import { Upload, Download, Send, FileText, Users, CheckCircle, MessageSquare, Calendar, IdCard, FileSpreadsheet, BarChart3, Crown, Headphones, Truck, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CSVImportModal } from './CSVImportModal';
import { ComplianceExportModal } from './ComplianceExportModal';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return Crown;
    case 'dispatcher':
      return Headphones;
    case 'driver':
      return Truck;
    default:
      return Shield;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-gradient-to-r from-purple-500 to-purple-600';
    case 'dispatcher':
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
    case 'driver':
      return 'bg-gradient-to-r from-green-500 to-green-600';
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600';
  }
};

export function BulkTeamOperations() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [bulkAction, setBulkAction] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all team members
  const { data: allMembers = [], isLoading } = useQuery({
    queryKey: ['team-members-bulk'],
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
        `);
      
      if (error) throw error;
      return data.map(member => ({
        id: member.id,
        email: member.email || '',
        firstName: member.first_name || '',
        lastName: member.last_name || '',
        role: member.user_roles?.[0]?.role || 'unknown',
        status: member.status || 'active'
      }));
    }
  });

  // Filter members based on selected role
  const filteredMembers = selectedRole === 'all' 
    ? allMembers 
    : allMembers.filter(member => member.role === selectedRole);

  // Group members by role for display
  const membersByRole = {
    admin: allMembers.filter(m => m.role === 'admin'),
    dispatcher: allMembers.filter(m => m.role === 'dispatcher'),
    driver: allMembers.filter(m => m.role === 'driver')
  };

  // Bulk reminder mutation
  const bulkReminderMutation = useMutation({
    mutationFn: async ({ memberIds, message }: { memberIds: string[], message: string }) => {
      const { data, error } = await supabase.functions.invoke('send-bulk-reminders', {
        body: { memberIds, message, type: 'manual' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Messages Sent",
        description: `Sent messages to ${selectedMembers.length} team members successfully.`
      });
      setSelectedMembers([]);
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
    mutationFn: async ({ memberIds, status }: { memberIds: string[], status: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .in('id', memberIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: `Updated status for ${selectedMembers.length} team members successfully.`
      });
      setSelectedMembers([]);
      setStatusUpdate('');
      queryClient.invalidateQueries({ queryKey: ['team-members-bulk'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update team member status. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(filteredMembers.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleRoleSelection = (role: string, checked: boolean) => {
    const roleMembers = membersByRole[role as keyof typeof membersByRole] || [];
    if (checked) {
      setSelectedMembers(prev => [...new Set([...prev, ...roleMembers.map(m => m.id)])]);
    } else {
      const roleMemberIds = roleMembers.map(m => m.id);
      setSelectedMembers(prev => prev.filter(id => !roleMemberIds.includes(id)));
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = `firstName,lastName,email,phone,role,homeBase,hireDate
John,Doe,john.doe@example.com,555-0123,driver,Main Office,2024-01-15
Jane,Smith,jane.smith@example.com,555-0124,dispatcher,Warehouse,2024-02-20
Bob,Johnson,bob.johnson@example.com,555-0125,admin,Main Office,2024-03-10`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bulk Team Operations</h2>
          <p className="text-muted-foreground">
            Manage multiple team members efficiently with bulk operations
          </p>
        </div>
      </div>

      {/* Team Member Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Member Selection
          </CardTitle>
          <CardDescription>
            Select team members for bulk operations ({selectedMembers.length} selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Role Filter */}
            <div className="flex items-center gap-4">
              <Label>Filter by Role:</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="dispatcher">Dispatchers</SelectItem>
                  <SelectItem value="driver">Drivers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label>Select All Filtered ({filteredMembers.length})</Label>
              </div>
              
              {Object.entries(membersByRole).map(([role, members]) => {
                const RoleIcon = getRoleIcon(role);
                const allRoleSelected = members.length > 0 && members.every(m => selectedMembers.includes(m.id));
                
                return (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox
                      checked={allRoleSelected}
                      onCheckedChange={(checked) => handleRoleSelection(role, !!checked)}
                    />
                    <RoleIcon className="h-4 w-4" />
                    <Label className="capitalize">{role}s ({members.length})</Label>
                  </div>
                );
              })}
            </div>

            {selectedMembers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMembers([])}
              >
                Clear Selection
              </Button>
            )}

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {filteredMembers.map((member) => {
                const RoleIcon = getRoleIcon(member.role);
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => handleMemberSelection(member.id, !!checked)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <RoleIcon className="h-3 w-3" />
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.email}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge 
                        variant={member.status === 'active' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {member.status}
                      </Badge>
                      <Badge 
                        className={`text-xs text-white ${getRoleColor(member.role)}`}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                );
              })}
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
                Send communications and perform operational tasks on selected team members
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
                  onClick={() => bulkReminderMutation.mutate({ memberIds: selectedMembers, message: reminderMessage })}
                  disabled={!reminderMessage.trim() || selectedMembers.length === 0 || bulkReminderMutation.isPending}
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
                    onClick={() => bulkStatusMutation.mutate({ memberIds: selectedMembers, status: statusUpdate })}
                    disabled={!statusUpdate || selectedMembers.length === 0 || bulkStatusMutation.isPending}
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
                    Distribute policy updates, forms, or notices to selected team members.
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
                    Assign multiple team members to shifts and time slots.
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
                Import, export, and generate reports for team member data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Import Team Members */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <h3 className="font-medium">Import Team Members</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload CSV file to import multiple team member records.
                  </p>
                  <Button 
                    onClick={() => setShowImportModal(true)}
                    className="w-full"
                    size="sm"
                  >
                    Import CSV
                  </Button>
                </div>

                {/* Export Team Data */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <h3 className="font-medium">Export Team Data</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export team member data for reporting and analysis.
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
                    Download the template for importing team member data.
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showImportModal && (
        <CSVImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['team-members-bulk'] });
            setShowImportModal(false);
          }}
        />
      )}

      {showExportModal && (
        <ComplianceExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}