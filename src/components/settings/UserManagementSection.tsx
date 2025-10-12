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

const roleClasses = {
  admin: "font-bold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
  dispatcher: "font-bold bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
  driver: "font-bold bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]",
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
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
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
      console.log('🗑️ Starting deletion for user:', userId);
      
      // Step 1: Check if user can be deleted
      console.log('📋 Checking deletion blockers...');
      const { data: canDeleteData, error: canDeleteError } = await supabase.rpc(
        'can_delete_user',
        { profile_identifier: userId }
      );

      if (canDeleteError) {
        console.error('❌ Error checking deletion blockers:', canDeleteError);
        // If pre-check fails, offer force delete instead
        throw new Error(`BLOCKED: Unable to verify deletion status. Use Force Delete to proceed.`);
      }

      console.log('✅ Can delete check result:', canDeleteData);

      const deleteCheck = canDeleteData as { can_delete: boolean; reason?: string } | null;
      if (!deleteCheck?.can_delete) {
        const reason = deleteCheck?.reason || 'User has active dependencies';
        throw new Error(`BLOCKED: ${reason}`);
      }

      // Step 2: Delete from user_roles
      console.log('🔑 Deleting user roles...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) {
        console.error('❌ Role deletion error:', roleError);
        throw new Error(`Failed to delete user role: ${roleError.message}`);
      }
      console.log('✅ User roles deleted');

      // Step 3: Delete from profiles table
      console.log('👤 Deleting user profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Profile deletion error:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        throw new Error(`Failed to delete user profile: ${profileError.message}`);
      }
      console.log('✅ User profile deleted successfully');
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
      console.log('Deletion error:', error);
      
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
        // Offer force delete for any other error as well
        toast.error(error.message || "Failed to delete user", {
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
      }
    },
  });

  const forceDeleteUser = useMutation({
    mutationFn: async (userId: string) => {
      console.log('💪 Force deleting user:', userId);
      
      const { data, error } = await supabase.rpc('force_delete_user', {
        profile_identifier: userId
      });

      if (error) {
        console.error('❌ Force delete error:', error);
        throw error;
      }

      const result = data as { success: boolean; error?: string } | null;
      if (!result?.success) {
        throw new Error(result?.error || 'Force delete failed');
      }

      console.log('✅ Force delete completed:', data);
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
      
      toast.success(`User force deleted. ${summary}`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Force delete error:', error);
      toast.error(error.message || "Force delete failed");
    },
  });

  const purgeAllUsers = useMutation({
    mutationFn: async () => {
      if (!clerkUser?.id) {
        throw new Error('Not authenticated');
      }

      console.log('🧹 Purging all users except:', clerkUser.id);
      
      const { data, error } = await supabase.rpc('purge_users_except', {
        p_owner_clerk_id: clerkUser.id
      });

      if (error) {
        console.error('❌ Purge error:', error);
        throw error;
      }

      console.log('✅ Purge completed:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setShowPurgeDialog(false);
      setPurgeConfirmText('');
      const result = data as { processed: number; failures: number };
      toast.success(
        `Purge completed: ${result.processed} users deleted${
          result.failures > 0 ? `, ${result.failures} failures` : ''
        }`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to purge users");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} total team {users.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowPurgeDialog(true)}
              disabled={purgeAllUsers.isPending}
            >
              {purgeAllUsers.isPending ? 'Purging...' : 'Purge All Test Users'}
            </Button>
          )}
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters and view toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="dispatcher">Dispatcher</SelectItem>
            <SelectItem value="driver">Driver</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Current user card */}
      {filteredCurrentUser && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">{filteredCurrentUser.first_name} {filteredCurrentUser.last_name}</p>
                <p className="text-sm text-muted-foreground">{filteredCurrentUser.email}</p>
              </div>
              <Badge className={roleClasses[filteredCurrentUser.current_role as keyof typeof roleClasses] || 'bg-muted text-foreground'}>
                {roleLabels[filteredCurrentUser.current_role as keyof typeof roleLabels] || filteredCurrentUser.current_role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other users */}
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOtherUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.first_name} {user.last_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={roleClasses[user.current_role as keyof typeof roleClasses] || 'bg-muted text-foreground'}>
                      {roleLabels[user.current_role as keyof typeof roleLabels] || user.current_role || 'No Role'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {canDeleteUser(user) && (
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(user)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit user modal */}
      <EditUserModal
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />

      <AddUserModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmOpen(false);
              setUserToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purge all users dialog */}
      <AlertDialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">⚠️ Danger Zone: Purge All Users</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="font-semibold">
                This will permanently delete ALL users except you from the system.
              </p>
              <p>This includes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All user profiles and roles</li>
                <li>All driver credentials and working hours</li>
                <li>Unassigning jobs and vehicle assignments</li>
              </ul>
              <p className="text-red-600 font-semibold">
                This action CANNOT be undone!
              </p>
              <div className="mt-4">
                <label className="text-sm font-medium">
                  Type <span className="font-mono bg-muted px-1">DELETE ALL</span> to confirm:
                </label>
                <Input
                  type="text"
                  value={purgeConfirmText}
                  onChange={(e) => setPurgeConfirmText(e.target.value)}
                  className="mt-2"
                  placeholder="DELETE ALL"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowPurgeDialog(false);
              setPurgeConfirmText('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (purgeConfirmText === 'DELETE ALL') {
                  purgeAllUsers.mutate();
                } else {
                  toast.error('Please type "DELETE ALL" to confirm');
                }
              }}
              disabled={purgeConfirmText !== 'DELETE ALL' || purgeAllUsers.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {purgeAllUsers.isPending ? 'Purging...' : 'Purge All Users'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
