import React, { useState } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, UserX, Crown, Headphones, Truck, User, Shield, MoreVertical, Grid3X3, List } from "lucide-react";
import { EnhancedUserProfileCard } from "@/components/team/enhanced/EnhancedUserProfileCard";
import { UserListView } from "@/components/team/enhanced/UserListView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useClerkProfileSync } from "@/hooks/useClerkProfileSync";
import { EditUserModal } from "./EditUserModal";
import { useUser } from "@clerk/clerk-react";

const userFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["admin", "dispatch", "driver"]),
});

type UserFormData = z.infer<typeof userFormSchema>;

const roleColors = {
  admin: "bg-gradient-primary",
  dispatch: "bg-gradient-secondary", 
  driver: "bg-gradient-accent",
};

const roleLabels = {
  admin: "Admin",
  dispatch: "Dispatcher",
  driver: "Driver",
};

const roleIcons = {
  admin: Crown,
  dispatch: Headphones,
  driver: Truck,
};

export function UserManagementSection() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { isOwner } = useUserRole();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  
  // Auto-sync current user's profile from Clerk
  useClerkProfileSync();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles!inner (
            role
          )
        `);
      
      if (error) throw error;
      
      // Transform the data to ensure user_roles is properly structured
      return data?.map(user => ({
        ...user,
        current_role: Array.isArray(user.user_roles) 
          ? user.user_roles[0]?.role 
          : user.user_roles?.role || null
      })) || [];
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
      // Delete role first (foreign key constraint)
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (roleError) throw roleError;

      // Then delete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("User deleted successfully");
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      setDeleteConfirmText("");
    },
    onError: (error) => {
      toast.error("Failed to delete user");
      console.error("Error deleting user:", error);
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
    if (deleteConfirmText === "delete" && userToDelete) {
      deleteUser.mutate(userToDelete.id);
    }
  };

  // Separate current user from others
  const currentUser = users.find(user => user.clerk_user_id === clerkUser?.id);
  const otherUsers = users.filter(user => user.clerk_user_id !== clerkUser?.id);

  // Filter current user
  const filteredCurrentUser = currentUser && (() => {
    const matchesSearch = !searchTerm || 
      `${currentUser.first_name} ${currentUser.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currentUser.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || currentUser.current_role === roleFilter;
    
    return matchesSearch && matchesRole ? currentUser : null;
  })();

  // Filter and sort other users alphabetically by first name
  const filteredOtherUsers = otherUsers
    .filter(user => {
      const matchesSearch = !searchTerm || 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.current_role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => a.first_name.toLowerCase().localeCompare(b.first_name.toLowerCase()));

  // Combine for display
  const allFilteredUsers = filteredCurrentUser ? [filteredCurrentUser, ...filteredOtherUsers] : filteredOtherUsers;

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
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="driver">Driver</SelectItem>
                            <SelectItem value="dispatcher">Dispatcher</SelectItem>
                            <SelectItem value="owner">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createUser.isPending}>
                      {createUser.isPending ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
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
                <SelectItem value="dispatch">Dispatcher</SelectItem>
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
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

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
              <AlertDialogDescription className="space-y-3">
                <p>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    {userToDelete?.first_name} {userToDelete?.last_name}
                  </span>
                  ?
                </p>
                <p className="text-destructive font-medium">
                  This action cannot be undone. This will permanently delete the user account and all associated data.
                </p>
                <div className="pt-2">
                  <p className="text-sm mb-2">
                    Type <span className="font-mono bg-muted px-1 rounded">delete</span> to confirm:
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type 'delete' to confirm"
                    className="font-mono"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteConfirmOpen(false);
                setUserToDelete(null);
                setDeleteConfirmText("");
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText !== "delete" || deleteUser.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteUser.isPending ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}