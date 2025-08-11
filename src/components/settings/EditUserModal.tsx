import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


const editUserFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["owner", "dispatcher", "driver", "customer", "admin"]),
});

type EditUserFormData = z.infer<typeof editUserFormSchema>;

interface EditUserModalProps {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    profile_photo?: string | null;
    user_roles?: Array<{ role: string }>;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserModal({ user, open, onOpenChange }: EditUserModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: (user.user_roles?.[0]?.role as any) || "driver",
    },
  });

  const updateUser = useMutation({
    mutationFn: async (data: EditUserFormData & { profile_photo?: string | null }) => {
      console.log('Updating user:', user.id, 'with data:', data);
      
      try {
        // Update profile
        const updateData: any = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
        };

        if (data.profile_photo !== undefined) {
          updateData.profile_photo = data.profile_photo;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          throw new Error(`Failed to update profile: ${profileError.message}`);
        }

        // Check current role
        const { data: currentRoles, error: checkError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (checkError) {
          console.error('Role check error:', checkError);
          throw new Error(`Failed to check current role: ${checkError.message}`);
        }

        console.log('Current roles:', currentRoles);

        // Delete existing role if any
        if (currentRoles && currentRoles.length > 0) {
          const { error: deleteError } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", user.id);

          if (deleteError) {
            console.error('Role delete error:', deleteError);
            throw new Error(`Failed to delete existing role: ${deleteError.message}`);
          }
        }

        // Insert new role
        const { data: insertedRole, error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            role: data.role,
          })
          .select();

        if (roleError) {
          console.error('Role insert error:', roleError);
          throw new Error(`Failed to insert new role: ${roleError.message}`);
        }

        console.log('User update completed successfully. New role:', insertedRole);
        return { success: true };
      } catch (error) {
        console.error('User update failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      queryClient.invalidateQueries({ queryKey: ['drivers-with-hours'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("User updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to update user");
      console.error("Error updating user:", error);
    },
  });

  const onSubmit = (data: EditUserFormData) => {
    updateUser.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              Profile photos are managed through Clerk. Users can update their photos by clicking their avatar in the top right corner.
            </div>
            
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
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}