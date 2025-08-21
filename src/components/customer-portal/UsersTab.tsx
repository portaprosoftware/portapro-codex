import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Settings,
  Bell,
  Eye,
  Edit,
  Trash2,
  MapPin,
  CreditCard,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UsersTabProps {
  customerId: string;
}

const USER_ROLES = [
  { 
    value: 'admin', 
    label: 'Admin', 
    description: 'Full access, billing, user management',
    permissions: ['all']
  },
  { 
    value: 'requester', 
    label: 'Requester', 
    description: 'Submit requests, view services',
    permissions: ['submit_requests', 'view_services']
  },
  { 
    value: 'site_contact', 
    label: 'Site Contact', 
    description: 'Location-specific access',
    permissions: ['location_access', 'view_services']
  },
  { 
    value: 'billing_only', 
    label: 'AP (Billing Only)', 
    description: 'Invoice and payment access only',
    permissions: ['view_billing', 'make_payments']
  }
];

const NOTIFICATION_TYPES = [
  { key: 'service_reminders', label: 'Service Reminders', description: 'Upcoming and completed service notifications' },
  { key: 'payment_due', label: 'Payment Due Alerts', description: 'Invoice due date reminders' },
  { key: 'payment_receipts', label: 'Payment Receipts', description: 'Payment confirmation emails' },
  { key: 'service_updates', label: 'Service Updates', description: 'Real-time service status updates' },
  { key: 'account_changes', label: 'Account Changes', description: 'User and account modification notifications' }
];

export const UsersTab: React.FC<UsersTabProps> = ({ customerId }) => {
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    locations: [] as string[]
  });

  // Fetch customer contacts/users (using customer_contacts as user data)
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['customer-users', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mock enhanced user data with roles and permissions
      return data?.map(contact => ({
        ...contact,
        role: contact.contact_type === 'primary' ? 'admin' : 'requester',
        permissions: contact.contact_type === 'primary' ? ['all'] : ['submit_requests', 'view_services'],
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        notificationPreferences: {
          email: true,
          sms: false,
          service_reminders: true,
          payment_due: contact.contact_type === 'primary',
          payment_receipts: contact.contact_type === 'primary',
          service_updates: true,
          account_changes: contact.contact_type === 'primary'
        }
      })) || [];
    },
    enabled: !!customerId,
  });

  // Fetch customer locations for site contact assignment
  const { data: locations = [] } = useQuery({
    queryKey: ['customer-locations', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('id, location_name, street, city, state')
        .eq('customer_id', customerId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'requester': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'site_contact': return 'bg-green-100 text-green-800 border-green-200';
      case 'billing_only': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'requester': return UserCheck;
      case 'site_contact': return MapPin;
      case 'billing_only': return CreditCard;
      default: return Users;
    }
  };

  const resetNewUserForm = () => {
    setNewUserData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      locations: []
    });
  };

  if (usersLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Users & Roles</h3>
          <p className="text-sm text-muted-foreground">
            Manage team access and notification preferences
          </p>
        </div>
        
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUserData.role} onValueChange={(value) => setNewUserData({...newUserData, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newUserData.role === 'site_contact' && (
                <div className="space-y-2">
                  <Label>Assigned Locations</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={location.id}
                          checked={newUserData.locations.includes(location.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUserData({
                                ...newUserData,
                                locations: [...newUserData.locations, location.id]
                              });
                            } else {
                              setNewUserData({
                                ...newUserData,
                                locations: newUserData.locations.filter(id => id !== location.id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={location.id} className="text-sm">
                          {location.location_name} - {location.street}, {location.city}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => {
                  // Handle user creation
                  setShowAddUserDialog(false);
                  resetNewUserForm();
                }} className="flex-1">
                  Send Invitation
                </Button>
                <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Team Members</TabsTrigger>
          <TabsTrigger value="roles">Role Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="space-y-3">
            {users.map((user) => {
              const RoleIcon = getRoleIcon(user.role);
              return (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <RoleIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{user.first_name} {user.last_name}</h5>
                            <Badge className={cn("text-xs", getRoleColor(user.role))}>
                              {USER_ROLES.find(r => r.value === user.role)?.label || user.role}
                            </Badge>
                            {user.is_primary && (
                              <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">Last login</p>
                          <p>{user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy') : 'Never'}</p>
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Name</label>
                                    <p className="text-sm">{user.first_name} {user.last_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Role</label>
                                    <Badge className={cn("text-xs", getRoleColor(user.role))}>
                                      {USER_ROLES.find(r => r.value === user.role)?.label || user.role}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p className="text-sm">{user.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Phone</label>
                                    <p className="text-sm">{user.phone || 'Not provided'}</p>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Permissions</label>
                                  <div className="mt-2 space-y-1">
                                    {USER_ROLES.find(r => r.value === user.role)?.permissions.map((permission) => (
                                      <div key={permission} className="text-sm text-muted-foreground">
                                        • {permission.replace('_', ' ')}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Notification Preferences</label>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm">Email Notifications</span>
                                      <Switch checked={user.notificationPreferences?.email} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm">SMS Notifications</span>
                                      <Switch checked={user.notificationPreferences?.sms} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>

                          {!user.is_primary && (
                            <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <h4 className="text-md font-medium">Role Permissions</h4>
          <div className="grid gap-4">
            {USER_ROLES.map((role) => {
              const RoleIcon = getRoleIcon(role.value);
              return (
                <Card key={role.value}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <RoleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{role.label}</CardTitle>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Permissions:</label>
                      {role.permissions.map((permission) => (
                        <div key={permission} className="text-sm text-muted-foreground">
                          • {permission.replace('_', ' ')}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <h4 className="text-md font-medium">Global Notification Settings</h4>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFICATION_TYPES.map((notificationType) => (
                <div key={notificationType.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{notificationType.label}</p>
                    <p className="text-sm text-muted-foreground">{notificationType.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive urgent notifications via SMS</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};