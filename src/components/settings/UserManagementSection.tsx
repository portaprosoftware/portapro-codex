import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, UserX, Crown, Headphones, Truck, User, Shield, MoreVertical, Grid3X3, List, Upload, FileText, TrendingUp, Bell, Send, RefreshCw } from "lucide-react";
import { EnhancedUserProfileCard } from "@/components/team/enhanced/EnhancedUserProfileCard";
import { UserListView } from "@/components/team/enhanced/UserListView";
import { BulkTeamOperations } from "@/components/team/BulkTeamOperations";
import { ComplianceDashboard } from "@/components/team/ComplianceDashboard";
import { CustomReportBuilder } from "@/components/team/CustomReportBuilder";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useInviteUser } from "@/hooks/useInviteUser";
import { useClerkProfileSync } from "@/hooks/useClerkProfileSync";
import { EditUserModal } from "./EditUserModal";
import { AddUserModal } from "./AddUserModal";
import { InvitationStatusBadge } from "@/components/team/InvitationStatusBadge";
import { useUser } from "@clerk/clerk-react";

const userFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["admin", "dispatcher", "driver"]),
});

type UserFormData = z.infer<typeof userFormSchema>;

const roleColors = {
  admin: "bg-gradient-primary",
  dispatcher: "bg-gradient-secondary", 
  driver: "bg-gradient-accent",
};

const roleLabels = {
  admin: "Admin",
  dispatcher: "Dispatcher",
  driver: "Driver",
};

const roleIcons = {
  admin: Crown,
  dispatcher: Headphones,
  driver: Truck,
};

// Define sort types
type SortDirection = 'asc' | 'desc' | 'default';
type SortColumn = 'first_name' | 'last_name' | 'role' | 'status';

export function UserManagementSection() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('default');
  const [showInvitations, setShowInvitations] = useState(false);
  const { isOwner } = useUserRole();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const inviteUser = useInviteUser();
  
  // Auto-sync current user's profile from Clerk
  useClerkProfileSync();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles!left (
            role
          )
        `);
      
      if (error) throw error;
      
      // Transform the data to ensure user_roles is properly structured for EditUserModal
      return data?.map(user => {
        console.log('UserManagementSection - Processing user:', user.first_name, user.last_name);
        console.log('UserManagementSection - User roles data:', user.user_roles);
        
        const current_role = Array.isArray(user.user_roles) 
          ? user.user_roles[0]?.role 
          : user.user_roles?.role || null;
          
        console.log('UserManagementSection - Assigned current_role:', current_role);
        
        return {
          ...user,
          current_role: current_role || null,
          // Keep the original user_roles structure for EditUserModal
          user_roles: Array.isArray(user.user_roles) 
            ? user.user_roles 
            : user.user_roles ? [user.user_roles] : [],
          // Add visual indicator for users without roles
          hasRole: !!current_role
        };
      }) || [];
    },
  });

  // Fetch pending invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['user-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching invitations:', error);
        throw error;
      }
      
      return data || [];
    },
  });


  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "driver",
    },
  });

  // Handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'default') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('default');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const createUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      // First create the profile
      const profileId = crypto.randomUUID();
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: profileId,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
          clerk_user_id: `temp_${Date.now()}`,
        });

      if (profileError) throw profileError;

      // Then create the role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profileId,
          role: data.role,
        });

      if (roleError) throw roleError;
      return { id: profileId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("User created successfully");
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to create user");
      console.error("Error creating user:", error);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🗑️ Starting deletion process for user:', userId);
      
      const userToDelete = users?.find(u => u.id === userId);
      console.log('User to delete:', userToDelete);
      
      // Step 1: Check if user can be safely deleted
      console.log('Step 1: Checking deletion blockers...');
      const { data: canDeleteData, error: checkError } = await supabase
        .rpc('can_delete_user', { user_uuid: userId });
      
      if (checkError) {
        console.error('❌ Error checking deletion blockers:', checkError);
        throw new Error(`Failed to check deletion status: ${checkError.message}`);
      }
      
      console.log('Deletion check result:', canDeleteData);
      
      // If there are blockers, throw error with details
      if (canDeleteData && typeof canDeleteData === 'object' && 'can_delete' in canDeleteData) {
        const result = canDeleteData as { can_delete: boolean; reason?: string };
        if (!result.can_delete) {
          const reason = result.reason || 'User has dependencies that must be removed first';
          throw new Error(`BLOCKED: ${reason}`);
        }
      }
      
      // Step 2: Try normal deletion (roles + profile)
      console.log('Step 2: Attempting normal deletion...');
      
      // Delete from user_roles using profile id (uuid)
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (roleError) {
        console.error('❌ Failed to delete user roles:', roleError);
        if (roleError.code === '23503') {
          throw new Error('Cannot delete: User role has dependencies in other tables');
        }
        throw new Error(`Failed to delete user role: ${roleError.message}`);
      }
      
      console.log('✅ User roles deleted successfully');
      
      // Delete from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        console.error('❌ Failed to delete profile:', profileError);
        console.error('Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        if (profileError.code === '23503') {
          throw new Error('Cannot delete: Profile has foreign key dependencies');
        }
        if (profileError.code === '42501') {
          throw new Error('Permission denied: Missing RLS policy for profile deletion');
        }
        
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }
      
      console.log('✅ Profile deleted successfully');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("User deleted successfully");
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Deletion error:', error);
      
      // Check if this is a blocker error that needs force delete
      if (error.message.startsWith('BLOCKED:')) {
        const reason = error.message.replace('BLOCKED: ', '');
        toast.error(reason, {
          action: {
            label: "Force Delete",
            onClick: () => {
              if (userToDelete) {
                forceDeleteUser.mutate(userToDelete.id);
              }
            }
          },
          duration: 10000,
        });
      } else {
        toast.error(error.message || "Failed to delete user");
      }
    },
  });

  const forceDeleteUser = useMutation({
    mutationFn: async (userId: string) => {
      console.log('💪 Force deleting user:', userId);
      
      const { data, error } = await supabase
        .rpc('force_delete_user', { p_profile_id: userId });
      
      if (error) {
        console.error('❌ Force delete error:', error);
        throw new Error(`Force delete failed: ${error.message}`);
      }
      
      console.log('✅ Force delete result:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      
      const summary = Object.entries(data || {})
        .filter(([key]) => key !== 'success')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      toast.success(`User force deleted successfully. ${summary}`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Force delete mutation error:', error);
      toast.error(error.message || "Force delete failed");
    },
  });

  const purgeAllUsers = useMutation({
    mutationFn: async () => {
      if (!clerkUser?.id) {
        throw new Error('No authenticated user found');
      }
      
      console.log('🧹 Purging all users except:', clerkUser.id);
      
      const { data, error } = await supabase
        .rpc('purge_users_except', { p_owner_clerk_id: clerkUser.id });
      
      if (error) {
        console.error('❌ Purge error:', error);
        throw new Error(`Purge failed: ${error.message}`);
      }
      
      console.log('✅ Purge result:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      
      const result = data as { processed: number; failures: number };
      toast.success(`Purged ${result.processed} users successfully. ${result.failures} failures.`);
    },
    onError: (error: Error) => {
      console.error('Purge mutation error:', error);
      toast.error(error.message || "Purge failed");
    },
  });


  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !isActive })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("User status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update user status");
      console.error("Error updating user status:", error);
    },
  });


  const onSubmit = (data: UserFormData) => {
    createUser.mutate(data);
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUser.mutate(userToDelete.id);
    }
  };

  // Check if user can delete (admin/dispatcher role and not themselves)
  const canDeleteUser = (user: any) => {
    if (!isOwner) return false; // Only admin/dispatcher can delete
    if (user.clerk_user_id === clerkUser?.id) return false; // Can't delete themselves
    return true;
  };


  // Separate current user from others
  const currentUser = users.find(user => user.clerk_user_id === clerkUser?.id);
  const otherUsers = users.filter(user => user.clerk_user_id !== clerkUser?.id);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.current_role === roleFilter;
      
      return matchesSearch && matchesRole;
  });

    // Apply sorting
    if (sortColumn && sortDirection !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        
        switch (sortColumn) {
          case 'first_name':
            comparison = (a.first_name || '').localeCompare(b.first_name || '');
            break;
          case 'last_name':
            comparison = (a.last_name || '').localeCompare(b.last_name || '');
            break;
          case 'role':
            // Sort order: admin → dispatcher → driver
            const roleOrder = { admin: 1, dispatcher: 2, driver: 3 };
            const roleA = roleOrder[a.current_role as keyof typeof roleOrder] || 999;
            const roleB = roleOrder[b.current_role as keyof typeof roleOrder] || 999;
            comparison = roleA - roleB;
            break;
          case 'status':
            comparison = a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1;
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [users, searchTerm, roleFilter, sortColumn, sortDirection]);

  // Split filtered users for display sections
  const filteredCurrentUser = filteredAndSortedUsers.find(user => user.clerk_user_id === clerkUser?.id);
  const filteredOtherUsers = filteredAndSortedUsers.filter(user => user.clerk_user_id !== clerkUser?.id);

  // Combine for display
  const allFilteredUsers = filteredAndSortedUsers;

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <UserX className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            Only owners can access user management settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>User Management</span>
            <Badge variant="secondary">{allFilteredUsers.length} users</Badge>
          </CardTitle>
          
          <div className="flex gap-2">
            {isOwner && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm('⚠️ WARNING: This will DELETE ALL USERS except you.\n\nThis will clear all driver assignments, jobs, and related data.\n\nThis action CANNOT be undone!\n\nType YES to confirm.')) {
                    const confirmation = prompt('Type "DELETE ALL" to confirm this action:');
                    if (confirmation === 'DELETE ALL') {
                      purgeAllUsers.mutate();
                    }
                  }
                }}
                disabled={purgeAllUsers.isPending}
              >
                {purgeAllUsers.isPending ? 'Purging...' : '🧹 Purge All Test Users'}
              </Button>
            )}
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white rounded-full p-1 shadow-sm border w-fit overflow-x-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="bulk-operations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Bulk Operations</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Compliance</TabsTrigger>
            
            
          </TabsList>
          
          <TabsContent value="overview">
            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="dispatcher">Dispatcher</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 px-3"
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Grid
                </Button>
              </div>
            </div>

            {/* Users Display */}
            {viewMode === "list" ? (
              <div className="space-y-6">
                {/* Current User Section */}
                {filteredCurrentUser && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Your Profile</h3>
                    <UserListView
                      users={[filteredCurrentUser]}
                      onEdit={setEditingUser}
                      onDelete={handleDeleteClick}
                      onToggleStatus={(userId, isActive) => 
                        toggleUserStatus.mutate({ userId, isActive })
                      }
                      isLoading={isLoading}
                      canDeleteUser={canDeleteUser}
                    />
                  </div>
                )}
                
                {/* Other Users Section */}
                {filteredOtherUsers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Team Members</h3>
                    <UserListView
                      users={filteredOtherUsers}
                      onEdit={setEditingUser}
                      onDelete={handleDeleteClick}
                      onToggleStatus={(userId, isActive) => 
                        toggleUserStatus.mutate({ userId, isActive })
                      }
                      isLoading={isLoading}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      canDeleteUser={canDeleteUser}
                    />
                  </div>
                )}
              </div>
            ) : (
              isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current User Grid Section */}
                  {filteredCurrentUser && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Your Profile</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <EnhancedUserProfileCard
                           key={filteredCurrentUser.id}
                           user={filteredCurrentUser}
                           onEdit={setEditingUser}
                           onDelete={handleDeleteClick}
                           onToggleStatus={(userId, isActive) => 
                             toggleUserStatus.mutate({ userId, isActive })
                           }
                           canDeleteUser={canDeleteUser}
                         />
                      </div>
                    </div>
                  )}
                  
                  {/* Other Users Grid Section */}
                  {filteredOtherUsers.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Team Members</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOtherUsers.map((user) => (
                           <EnhancedUserProfileCard
                             key={user.id}
                             user={user}
                             onEdit={setEditingUser}
                             onDelete={handleDeleteClick}
                             onToggleStatus={(userId, isActive) => 
                               toggleUserStatus.mutate({ userId, isActive })
                             }
                             canDeleteUser={canDeleteUser}
                           />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="bulk-operations">
            <BulkTeamOperations />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceDashboard />
          </TabsContent>



        </Tabs>

        {/* Add User Modal */}
        <AddUserModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />

        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            open={!!editingUser}
            onOpenChange={(open) => !open && setEditingUser(null)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name}?
                This action cannot be undone and will permanently remove this user from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </CardContent>
    </Card>
  );
}