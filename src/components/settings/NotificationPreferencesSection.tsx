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
import { Bell, Save, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const notificationSchema = z.object({
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  push_notifications: z.boolean(),
  job_assignments: z.boolean(),
  maintenance_alerts: z.boolean(),
  invoice_reminders: z.boolean(),
  quote_updates: z.boolean(),
  system_updates: z.boolean(),
  marketing_emails: z.boolean(),
  phone_number: z.string().optional(),
  email_address: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const notificationCategories = [
  {
    title: "General Notifications",
    items: [
      { key: "email_notifications", label: "Email Notifications", description: "Receive notifications via email" },
      { key: "sms_notifications", label: "SMS Notifications", description: "Receive notifications via text message" },
      { key: "push_notifications", label: "Push Notifications", description: "Receive browser push notifications" },
    ]
  },
  {
    title: "Job & Operations",
    items: [
      { key: "job_assignments", label: "Job Assignments", description: "Get notified when jobs are assigned or updated" },
      { key: "maintenance_alerts", label: "Maintenance Alerts", description: "Receive alerts for vehicle maintenance schedules" },
    ]
  },
  {
    title: "Financial",
    items: [
      { key: "invoice_reminders", label: "Invoice Reminders", description: "Get reminders for overdue invoices" },
      { key: "quote_updates", label: "Quote Updates", description: "Notifications when quotes are accepted or expired" },
    ]
  },
  {
    title: "System & Marketing",
    items: [
      { key: "system_updates", label: "System Updates", description: "Important system notifications and updates" },
      { key: "marketing_emails", label: "Marketing Emails", description: "Promotional emails and company updates" },
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
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      job_assignments: true,
      maintenance_alerts: true,
      invoice_reminders: true,
      quote_updates: true,
      system_updates: false,
      marketing_emails: false,
      phone_number: "",
      email_address: "",
    },
  });

  React.useEffect(() => {
    if (preferences) {
      form.reset({
        email_notifications: preferences.job_status_change_email ?? true,
        sms_notifications: preferences.job_status_change_sms ?? false,
        push_notifications: true,  // Not in existing schema
        job_assignments: preferences.job_status_change_email ?? true,
        maintenance_alerts: preferences.maintenance_email_7_day ?? true,
        invoice_reminders: preferences.overdue_job_email ?? true,
        quote_updates: true,  // Use default since field doesn't exist
        system_updates: false,  // Not in existing schema
        marketing_emails: false,  // Not in existing schema
        phone_number: preferences.phone_number || "",
        email_address: "",  // Use default since field doesn't exist
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
          maintenance_email_7_day: data.maintenance_alerts,
          overdue_job_email: data.invoice_reminders,
          phone_number: data.phone_number || null,
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
          <CardTitle className="flex items-center space-x-2">
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
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="notifications@example.com" 
                          className="pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Email address for receiving notifications
                    </FormDescription>
                  </FormItem>
                )}
              />

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
                  <h3 className="text-lg font-semibold text-foreground">
                    {category.title}
                  </h3>
                  <div className="grid gap-4">
                    {category.items.map((item) => (
                      <FormField
                        key={item.key}
                        control={form.control}
                        name={item.key as keyof NotificationFormData}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">
                                {item.label}
                              </FormLabel>
                              <FormDescription>
                                {item.description}
                              </FormDescription>
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
              ))}

              <div className="flex justify-end pt-6">
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