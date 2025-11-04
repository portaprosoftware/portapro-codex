import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Save, Phone, Mail, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const notificationSchema = z.object({
  // General - Delivery Methods
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  push_notifications: z.boolean(),
  phone_number: z.string().optional(),
  
  // Jobs & Operations
  job_assignments_email: z.boolean(),
  job_assignments_sms: z.boolean(),
  route_schedule_changes_email: z.boolean(),
  route_schedule_changes_sms: z.boolean(),
  maintenance_alerts_email: z.boolean(),
  maintenance_alerts_sms: z.boolean(),
  
  // Financial
  quote_updates_email: z.boolean(),
  quote_updates_sms: z.boolean(),
  invoice_reminders_email: z.boolean(),
  invoice_reminders_sms: z.boolean(),
  payment_confirmations_email: z.boolean(),
  payment_confirmations_sms: z.boolean(),
  
  // Inventory & Fleet
  low_stock_alerts_email: z.boolean(),
  low_stock_alerts_sms: z.boolean(),
  asset_movement_email: z.boolean(),
  asset_movement_sms: z.boolean(),
  vehicle_status_changes_email: z.boolean(),
  vehicle_status_changes_sms: z.boolean(),
  
  // Team & Communication
  driver_check_ins_email: z.boolean(),
  driver_check_ins_sms: z.boolean(),
  new_team_members_email: z.boolean(),
  new_team_members_sms: z.boolean(),
  comment_mentions_email: z.boolean(),
  comment_mentions_sms: z.boolean(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const notificationCategories = [
  {
    title: "General Notifications",
    isDeliveryMethod: true,
    description: "Choose how you want to receive notifications",
    items: [
      { key: "email_notifications", label: "Email Notifications", description: "Receive notifications via email", icon: Mail },
      { key: "sms_notifications", label: "SMS Notifications", description: "Receive notifications via text message", icon: MessageSquare },
      { key: "push_notifications", label: "Push Notifications", description: "Receive browser push notifications", icon: Send },
    ]
  },
  {
    title: "Jobs & Operations",
    items: [
      { key: "job_assignments", label: "Job Assignments", description: "Get notified when new jobs are assigned, updated, or completed" },
      { key: "route_schedule_changes", label: "Route or Schedule Changes", description: "Receive alerts when a service route or scheduled time is modified" },
      { key: "maintenance_alerts", label: "Maintenance Alerts", description: "Receive alerts for upcoming vehicle or equipment maintenance" },
    ]
  },
  {
    title: "Financial",
    items: [
      { key: "quote_updates", label: "Quote Updates", description: "Get notified when quotes are accepted, rejected, or expired" },
      { key: "invoice_reminders", label: "Invoice Reminders", description: "Receive reminders when invoices are overdue or unpaid" },
      { key: "payment_confirmations", label: "Payment Confirmations", description: "Get alerts when customer payments are received or processed" },
    ]
  },
  {
    title: "Inventory & Fleet",
    items: [
      { key: "low_stock_alerts", label: "Low Stock Alerts", description: "Receive notifications when supplies or units reach low inventory levels" },
      { key: "asset_movement", label: "Asset Movement", description: "Get updates when units are delivered, picked up, or relocated" },
      { key: "vehicle_status_changes", label: "Vehicle Status Changes", description: "Alerts for unexpected downtime, breakdowns, or repairs" },
    ]
  },
  {
    title: "Team & Communication",
    items: [
      { key: "driver_check_ins", label: "Driver Check-Ins", description: "Receive notifications when drivers start or complete daily routes" },
      { key: "new_team_members", label: "New Team Members", description: "Get notified when a new user or role is added to your PortaPro account" },
      { key: "comment_mentions", label: "Comment & Note Mentions", description: "Get alerts when someone tags or mentions you in a job note or service report" },
    ]
  }
];

export function NotificationPreferencesSection() {
  const queryClient = useQueryClient();
  const { user } = useUserRole();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching notification preferences:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      phone_number: "",
      
      // Jobs & Operations
      job_assignments_email: true,
      job_assignments_sms: false,
      route_schedule_changes_email: true,
      route_schedule_changes_sms: false,
      maintenance_alerts_email: true,
      maintenance_alerts_sms: false,
      
      // Financial
      quote_updates_email: true,
      quote_updates_sms: false,
      invoice_reminders_email: true,
      invoice_reminders_sms: false,
      payment_confirmations_email: true,
      payment_confirmations_sms: false,
      
      // Inventory & Fleet
      low_stock_alerts_email: true,
      low_stock_alerts_sms: false,
      asset_movement_email: true,
      asset_movement_sms: false,
      vehicle_status_changes_email: true,
      vehicle_status_changes_sms: false,
      
      // Team & Communication
      driver_check_ins_email: true,
      driver_check_ins_sms: false,
      new_team_members_email: false,
      new_team_members_sms: false,
      comment_mentions_email: true,
      comment_mentions_sms: false,
    },
  });

  React.useEffect(() => {
    if (preferences) {
      form.reset({
        email_notifications: preferences.job_status_change_email ?? true,
        sms_notifications: preferences.job_status_change_sms ?? false,
        push_notifications: true,
        phone_number: preferences.phone_number || "",
        
        // Jobs & Operations
        job_assignments_email: preferences.new_job_assigned_email ?? true,
        job_assignments_sms: preferences.new_job_assigned_sms ?? false,
        route_schedule_changes_email: preferences.route_schedule_changes_email ?? true,
        route_schedule_changes_sms: preferences.route_schedule_changes_sms ?? false,
        maintenance_alerts_email: preferences.maintenance_email_7_day ?? true,
        maintenance_alerts_sms: preferences.maintenance_sms_7_day ?? false,
        
        // Financial
        quote_updates_email: preferences.quote_invoice_email ?? true,
        quote_updates_sms: preferences.quote_invoice_sms ?? false,
        invoice_reminders_email: preferences.invoice_reminders_email ?? true,
        invoice_reminders_sms: preferences.invoice_reminders_sms ?? false,
        payment_confirmations_email: preferences.payment_confirmations_email ?? true,
        payment_confirmations_sms: preferences.payment_confirmations_sms ?? false,
        
        // Inventory & Fleet
        low_stock_alerts_email: preferences.low_stock_alerts_email ?? true,
        low_stock_alerts_sms: preferences.low_stock_alerts_sms ?? false,
        asset_movement_email: preferences.asset_movement_email ?? true,
        asset_movement_sms: preferences.asset_movement_sms ?? false,
        vehicle_status_changes_email: preferences.vehicle_status_changes_email ?? true,
        vehicle_status_changes_sms: preferences.vehicle_status_changes_sms ?? false,
        
        // Team & Communication
        driver_check_ins_email: preferences.driver_check_ins_email ?? true,
        driver_check_ins_sms: preferences.driver_check_ins_sms ?? false,
        new_team_members_email: preferences.new_team_members_email ?? false,
        new_team_members_sms: preferences.new_team_members_sms ?? false,
        comment_mentions_email: preferences.comment_mentions_email ?? true,
        comment_mentions_sms: preferences.comment_mentions_sms ?? false,
      });
    }
  }, [preferences, form]);

  const updatePreferences = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      if (!user?.id) throw new Error("User not found");

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          job_status_change_email: data.email_notifications,
          job_status_change_sms: data.sms_notifications,
          phone_number: data.phone_number || null,
          
          // Jobs & Operations
          new_job_assigned_email: data.job_assignments_email,
          new_job_assigned_sms: data.job_assignments_sms,
          route_schedule_changes_email: data.route_schedule_changes_email,
          route_schedule_changes_sms: data.route_schedule_changes_sms,
          maintenance_email_7_day: data.maintenance_alerts_email,
          maintenance_sms_7_day: data.maintenance_alerts_sms,
          
          // Financial
          quote_invoice_email: data.quote_updates_email,
          quote_invoice_sms: data.quote_updates_sms,
          invoice_reminders_email: data.invoice_reminders_email,
          invoice_reminders_sms: data.invoice_reminders_sms,
          payment_confirmations_email: data.payment_confirmations_email,
          payment_confirmations_sms: data.payment_confirmations_sms,
          
          // Inventory & Fleet
          low_stock_alerts_email: data.low_stock_alerts_email,
          low_stock_alerts_sms: data.low_stock_alerts_sms,
          asset_movement_email: data.asset_movement_email,
          asset_movement_sms: data.asset_movement_sms,
          vehicle_status_changes_email: data.vehicle_status_changes_email,
          vehicle_status_changes_sms: data.vehicle_status_changes_sms,
          
          // Team & Communication
          driver_check_ins_email: data.driver_check_ins_email,
          driver_check_ins_sms: data.driver_check_ins_sms,
          new_team_members_email: data.new_team_members_email,
          new_team_members_sms: data.new_team_members_sms,
          comment_mentions_email: data.comment_mentions_email,
          comment_mentions_sms: data.comment_mentions_sms,
        }, { onConflict: "user_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Notification preferences updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update notification preferences");
      console.error("Error updating preferences:", error);
    },
  });

  const onSubmit = (data: NotificationFormData) => {
    updatePreferences.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Bell className="w-5 h-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-muted animate-pulse rounded w-48" />
                <div className="space-y-2">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Bell className="w-5 h-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="(555) 123-4567" 
                          className="pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Phone number for SMS notifications
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {notificationCategories.map((category) => (
                <div key={category.title} className="space-y-4">
                  {category.isDeliveryMethod ? (
                    // Delivery Method Section - Visually Distinct
                    <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-6 rounded-xl border-2 border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">
                            {category.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3 mt-4">
                        {category.items.map((item) => (
                          <FormField
                            key={item.key}
                            control={form.control}
                            name={item.key as keyof NotificationFormData}
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/40 transition-colors">
                                <div className="flex items-center gap-3">
                                  {item.icon && (
                                    <div className="p-2 bg-primary/10 rounded-md">
                                      <item.icon className="h-4 w-4 text-primary" />
                                    </div>
                                  )}
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base font-medium">
                                      {item.label}
                                    </FormLabel>
                                    <FormDescription>
                                      {item.description}
                                    </FormDescription>
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value as boolean}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Standard Notification Categories
                     <>
                      <h3 className="text-lg font-semibold text-foreground">
                        {category.title}
                      </h3>
                      <div className="grid gap-4">
                        {category.items.map((item) => (
                          <div key={item.key} className="space-y-3">
                            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                              <div className="space-y-0.5 flex-1">
                                <FormLabel className="text-base font-medium">
                                  {item.label}
                                </FormLabel>
                                <FormDescription>
                                  {item.description}
                                </FormDescription>
                              </div>
                            </div>
                            
                            {/* Email and SMS toggles */}
                            <div className="grid grid-cols-2 gap-3 pl-4">
                              <FormField
                                control={form.control}
                                name={`${item.key}_email` as keyof NotificationFormData}
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-muted-foreground" />
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        Email
                                      </FormLabel>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value as boolean}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`${item.key}_sms` as keyof NotificationFormData}
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        SMS
                                      </FormLabel>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value as boolean}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}

              <div className="flex flex-col items-center gap-4 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  You'll only receive notifications relevant to your role and permissions.
                </p>
                <Button 
                  type="submit" 
                  disabled={updatePreferences.isPending}
                  className="bg-gradient-primary hover:bg-gradient-primary/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updatePreferences.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}