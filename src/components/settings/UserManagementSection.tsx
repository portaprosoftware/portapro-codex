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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, UserX, Crown, Headphones, Truck, User, Shield, MoreVertical, Grid3X3, List, Upload, FileText, TrendingUp, Bell, Send, RefreshCw, ChevronDown, X, Eye, Calendar, Menu } from "lucide-react";
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
import { cn } from "@/lib/utils";

const userFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["admin", "dispatcher", "driver"]),
});

type UserFormData = z.infer<typeof userFormSchema>;

const roleColors = {
  admin: "bg-gradient-gold",
  dispatcher: "bg-gradient-secondary", 
  driver: "bg-gradient-green",
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">(
    typeof window !== 'undefined' && window.innerWidth < 768 ? "grid" : "list"
  );
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('default');
  const [showInvitations, setShowInvitations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tabSheetOpen, setTabSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { hasAdminAccess } = useUserRole();
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
      console.log("=== Starting user deletion ===");
      console.log("User ID to delete:", userId);
      
      // Get the user's clerk_user_id first
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("clerk_user_id, first_name, last_name, email")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
      }

      console.log("Profile to delete:", profile);

      // Check if this is a temporary test user
      const isTemporaryUser = profile?.clerk_user_id?.startsWith('temp_');
      if (isTemporaryUser) {
        console.warn("⚠️ Attempting to delete temporary test user:", profile.clerk_user_id);
      }

      // Delete role first using clerk_user_id (if exists)
      if (profile?.clerk_user_id) {
        const { error: roleError, data: deletedRole } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", profile.clerk_user_id)
          .select();

        if (roleError) {
          console.error("Error deleting user role:", roleError);
          console.error("Role error details:", {
            code: roleError.code,
            message: roleError.message,
            details: roleError.details,
            hint: roleError.hint
          });
        } else {
          console.log("✓ Deleted user_roles:", deletedRole);
        }
      }

      // Then delete profile
      const { error: profileError, data: deletedProfile } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId)
        .select();

      if (profileError) {
        console.error("Error deleting profile:", profileError);
        console.error("Profile error details:", {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        // Provide more specific error messages
        if (profileError.code === '23503') {
          throw new Error(`Cannot delete user: They have related records (jobs, assignments, etc.) that must be removed first.`);
        } else if (profileError.code === '42501') {
          throw new Error(`Permission denied: You don't have permission to delete this user.`);
        } else {
          throw new Error(`Failed to delete user profile: ${profileError.message}`);
        }
      }

      console.log("✓ Deleted profile:", deletedProfile);
      console.log("=== User deletion completed successfully ===");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("User deleted successfully");
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      console.error("=== User deletion failed ===");
      console.error("Full error:", error);
      
      // Show more specific error to user
      const errorMessage = error?.message || "Failed to delete user. Please check console for details.";
      toast.error(errorMessage);
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
    if (!hasAdminAccess) return false; // Allow any signed-in user during temporary override
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
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.current_role === roleFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);
      
      return matchesSearch && matchesRole && matchesStatus;
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

  if (!hasAdminAccess) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <UserX className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            You must be signed in to access user management.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 px-0 overflow-x-hidden">
      <Card className="rounded-2xl shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <Users className="w-5 h-5" />
                  <span>User Management</span>
                </CardTitle>
                <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0 w-fit">
                  {allFilteredUsers.length} Users
                </Badge>
              </div>
              
              {/* Desktop Invite Button */}
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="hidden lg:flex bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </div>

            {/* Mobile Invite Button */}
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="lg:hidden w-full min-h-[44px] bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            {/* Desktop Tabs */}
            <TabsList className="hidden lg:flex bg-white rounded-full p-1 shadow-sm border w-fit">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-4 py-2 text-sm whitespace-nowrap min-h-[44px]">Overview</TabsTrigger>
              <TabsTrigger value="bulk-operations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-4 py-2 text-sm whitespace-nowrap min-h-[44px]">Bulk Operations</TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-4 py-2 text-sm whitespace-nowrap min-h-[44px]">Compliance</TabsTrigger>
            </TabsList>

            {/* Mobile/Tablet Tabs - 50% Bottom Sheet */}
            <div className="lg:hidden">
              <Sheet open={tabSheetOpen} onOpenChange={setTabSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full justify-between min-h-[44px]">
                    <span className="capitalize font-medium">
                      {activeTab === "bulk-operations" ? "Bulk Operations" : activeTab}
                    </span>
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[50vh] rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>User Management</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    <Button
                      variant={activeTab === "overview" ? "default" : "ghost"}
                      className="w-full justify-start min-h-[56px] text-base"
                      onClick={() => { setActiveTab("overview"); setTabSheetOpen(false); }}
                    >
                      Overview
                    </Button>
                    <Button
                      variant={activeTab === "bulk-operations" ? "default" : "ghost"}
                      className="w-full justify-start min-h-[56px] text-base"
                      onClick={() => { setActiveTab("bulk-operations"); setTabSheetOpen(false); }}
                    >
                      Bulk Operations
                    </Button>
                    <Button
                      variant={activeTab === "compliance" ? "default" : "ghost"}
                      className="w-full justify-start min-h-[56px] text-base"
                      onClick={() => { setActiveTab("compliance"); setTabSheetOpen(false); }}
                    >
                      Compliance
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            <TabsContent value="overview" className="space-y-4">
              {/* Mobile Filter Sheet */}
              <div className="lg:hidden">
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full min-h-[44px] justify-between mb-4">
                      <span className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                        {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
                          <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0">
                            Active
                          </Badge>
                        )}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl">
                    <SheetHeader>
                      <SheetTitle>Filters & Sort</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-6 overflow-y-auto max-h-[calc(75vh-120px)]">
                      {/* Search */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search name, email, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-10 min-h-[44px]"
                          />
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm("")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Role Filter */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Role</label>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                          <SelectTrigger className="min-h-[44px]">
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

                      {/* Status Filter */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Deactivated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Clear Filters */}
                      <Button
                        variant="outline"
                        className="w-full min-h-[44px] border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSearchTerm("");
                          setRoleFilter("all");
                          setStatusFilter("all");
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users"
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

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
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

              {/* Mobile View Toggle */}
              <div className="lg:hidden flex bg-gray-100 rounded-lg p-1 mb-4">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="flex-1 min-h-[44px]"
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="flex-1 min-h-[44px]"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Grid
                </Button>
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Team Members</h3>
                      <span className="text-xs text-muted-foreground">- Driver users include an additional Driver Details profile</span>
                    </div>
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
    </div>
  );
}