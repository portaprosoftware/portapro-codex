import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Clock, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const businessHoursSchema = z.object({
  sunday: z.object({
    is_open: z.boolean(),
    open_time: z.string().optional(),
    close_time: z.string().optional(),
  }),
  monday: z.object({
    is_open: z.boolean(),
    open_time: z.string().optional(),
    close_time: z.string().optional(),
  }),
  tuesday: z.object({
    is_open: z.boolean(),
    open_time: z.string().optional(),
    close_time: z.string().optional(),
  }),
  wednesday: z.object({
    is_open: z.boolean(),
    open_time: z.string().optional(),
    close_time: z.string().optional(),
  }),
  thursday: z.object({
    is_open: z.boolean(),
    open_time: z.string().optional(),
    close_time: z.string().optional(),
  }),
  friday: z.object({
    is_open: z.boolean(),
    open_time: z.string().optional(),
    close_time: z.string().optional(),
  }),
  saturday: z.object({
    is_open: z.boolean(),
    open_time: z.string().optional(),
    close_time: z.string().optional(),
  }),
});

type BusinessHoursFormData = z.infer<typeof businessHoursSchema>;

const dayNames = [
  { key: "sunday", label: "Sunday", dayOfWeek: 0 },
  { key: "monday", label: "Monday", dayOfWeek: 1 },
  { key: "tuesday", label: "Tuesday", dayOfWeek: 2 },
  { key: "wednesday", label: "Wednesday", dayOfWeek: 3 },
  { key: "thursday", label: "Thursday", dayOfWeek: 4 },
  { key: "friday", label: "Friday", dayOfWeek: 5 },
  { key: "saturday", label: "Saturday", dayOfWeek: 6 },
] as const;

export function BusinessHoursSection() {
  const queryClient = useQueryClient();

  const { data: businessHours, isLoading } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .order("day_of_week");
      
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<BusinessHoursFormData>({
    resolver: zodResolver(businessHoursSchema),
    defaultValues: {
      sunday: { is_open: false, open_time: "09:00", close_time: "17:00" },
      monday: { is_open: true, open_time: "08:00", close_time: "17:00" },
      tuesday: { is_open: true, open_time: "08:00", close_time: "17:00" },
      wednesday: { is_open: true, open_time: "08:00", close_time: "17:00" },
      thursday: { is_open: true, open_time: "08:00", close_time: "17:00" },
      friday: { is_open: true, open_time: "08:00", close_time: "17:00" },
      saturday: { is_open: false, open_time: "09:00", close_time: "17:00" },
    },
  });

  React.useEffect(() => {
    if (businessHours && businessHours.length > 0) {
      const formData: BusinessHoursFormData = {} as BusinessHoursFormData;
      
      dayNames.forEach(({ key, dayOfWeek }) => {
        const dayData = businessHours.find(h => h.day_of_week === dayOfWeek);
        if (dayData) {
          formData[key] = {
            is_open: dayData.is_open,
            open_time: dayData.open_time || "08:00",
            close_time: dayData.close_time || "17:00",
          };
        }
      });
      
      form.reset(formData);
    }
  }, [businessHours, form]);

  const updateBusinessHours = useMutation({
    mutationFn: async (data: BusinessHoursFormData) => {
      const updates = dayNames.map(({ key, dayOfWeek }) => ({
        day_of_week: dayOfWeek,
        is_open: data[key].is_open,
        open_time: data[key].is_open ? data[key].open_time : null,
        close_time: data[key].is_open ? data[key].close_time : null,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("business_hours")
          .upsert(update, { onConflict: "day_of_week" });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      toast.success("Business hours updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update business hours");
      console.error("Error updating business hours:", error);
    },
  });

  const onSubmit = (data: BusinessHoursFormData) => {
    updateBusinessHours.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Business Hours</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Business Hours</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {dayNames.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-24">
                      <span className="font-medium">{label}</span>
                    </div>
                    <FormField
                      control={form.control}
                      name={`${key}.is_open`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {field.value ? "Open" : "Closed"}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch(`${key}.is_open`) && (
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name={`${key}.open_time`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                className="w-32"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="text-muted-foreground">to</span>
                      <FormField
                        control={form.control}
                        name={`${key}.close_time`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                className="w-32"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateBusinessHours.isPending}
                className="bg-gradient-primary hover:bg-gradient-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateBusinessHours.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}