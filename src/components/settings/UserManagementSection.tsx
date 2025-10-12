import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { EditUserModal } from './EditUserModal';
import { AddUserModal } from './AddUserModal';

// Helper to get role badge styling - solid gradients with white bold text
const getRoleBadgeClass = (role: string | null) => {
  const roleMap: Record<string, string> = {
    owner: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold',
    admin: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold',
    dispatcher: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold',
    driver: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold',
    viewer: 'bg-gradient-to-r from-slate-500 to-gray-600 text-white font-bold',
  };
  return roleMap[role?.toLowerCase() || ''] || 'bg-gradient-to-r from-zinc-400 to-zinc-500 text-white font-bold';
};

// Helper to format role display text - Title Case
const formatRoleLabel = (role: string | null) => {
  if (!role) return 'No Role';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

interface UserProfile {
  id: string;
  clerk_user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
}

export function UserManagementSection() {
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  // Fetch all users with their roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, clerk_user_id, first_name, last_name, email')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      return (profiles || []).map(profile => ({
        ...profile,
        role: rolesMap.get(profile.id) || null,
      })) as UserProfile[];
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('delete_user_everywhere', {
        profile_identifier: userId
      });

      if (error) throw error;
      
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || 'Failed to delete user');
      
      return result;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      const summary = data?.summary || {};
      toast.success('User deleted successfully', {
        description: `Cleaned up ${summary.jobs_unassigned || 0} jobs, ${summary.shifts_deleted || 0} shifts, and more.`,
      });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete user', {
        description: error.message || 'An error occurred while deleting the user',
      });
    },
  });

  // Purge all non-owner users (DEV only)
  const purgeAllUsers = useMutation({
    mutationFn: async () => {
      if (!clerkUser?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('purge_non_owner_users', {
        owner_clerk_id: clerkUser.id
      });

      if (error) throw error;
      
      const result = data as any;
      if (!result?.success) throw new Error('Failed to purge users');
      
      return result;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success(`Purge complete`, {
        description: `Processed: ${data.total_processed}, Success: ${data.total_success}, Failed: ${data.total_failed}`,
      });
      setPurgeConfirmOpen(false);
      setPurgeConfirmText('');
    },
    onError: (error: any) => {
      toast.error('Purge failed', {
        description: error.message,
      });
    },
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  // Current user from the list
  const currentUserProfile = users.find(u => u.clerk_user_id === clerkUser?.id);
  const filteredOtherUsers = filteredUsers.filter(u => u.clerk_user_id !== clerkUser?.id);

  const handleDeleteClick = (user: UserProfile) => {
    if (user.clerk_user_id === clerkUser?.id) {
      toast.error('Cannot delete yourself', {
        description: 'You cannot delete your own account',
      });
      return;
    }
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUser.mutate(userToDelete.id);
    }
  };

  const handlePurgeClick = () => {
    setPurgeConfirmText('');
    setPurgeConfirmOpen(true);
  };

  const handlePurgeConfirm = () => {
    if (purgeConfirmText === 'DELETE ALL') {
      purgeAllUsers.mutate();
    } else {
      toast.error('Incorrect confirmation text', {
        description: 'Please type "DELETE ALL" to confirm',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage team members and their roles
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 bg-white">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </Card>

      {/* Current User Card */}
      {currentUserProfile && (
        <Card className="p-6 bg-white">
          <h3 className="font-semibold text-lg mb-4">Your Account</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                {currentUserProfile.first_name?.[0]}{currentUserProfile.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold">
                  {currentUserProfile.first_name} {currentUserProfile.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{currentUserProfile.email}</p>
              </div>
            </div>
            <Badge className={getRoleBadgeClass(currentUserProfile.role)}>
              {formatRoleLabel(currentUserProfile.role)}
            </Badge>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card className="bg-white">
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">Team Members</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOtherUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOtherUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeClass(user.role)}>
                        {formatRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Danger Zone - DEV Only */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-lg text-red-900">Danger Zone (DEV Only)</h3>
            </div>
            <p className="text-sm text-red-800 mb-4">
              This section is only visible in development mode. These actions cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={handlePurgeClick}
              disabled={purgeAllUsers.isPending}
            >
              {purgeAllUsers.isPending ? 'Purging...' : 'Purge All Non-Owner Users'}
            </Button>
          </div>
        </Card>
      )}

      {/* Modals */}
      <EditUserModal
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />

      <AddUserModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {userToDelete?.first_name} {userToDelete?.last_name}
              </strong>
              ? This will unassign them from all jobs and remove all their data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purge Confirmation Dialog */}
      <AlertDialog open={purgeConfirmOpen} onOpenChange={setPurgeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purge All Non-Owner Users</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL users except you. Type{' '}
              <strong>DELETE ALL</strong> to confirm this destructive action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={purgeConfirmText}
            onChange={(e) => setPurgeConfirmText(e.target.value)}
            placeholder="Type DELETE ALL to confirm"
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurgeConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={purgeAllUsers.isPending || purgeConfirmText !== 'DELETE ALL'}
            >
              {purgeAllUsers.isPending ? 'Purging...' : 'Purge All Users'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
