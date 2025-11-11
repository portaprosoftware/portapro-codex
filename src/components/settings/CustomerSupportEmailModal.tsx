import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeUpdate } from "@/lib/supabase-helpers";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  support_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  sms_from_number: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface CustomerSupportEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string | null;
  currentSmsNumber?: string | null;
}

export const CustomerSupportEmailModal: React.FC<CustomerSupportEmailModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  currentSmsNumber,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      support_email: currentEmail || "",
      sms_from_number: currentSmsNumber || "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        support_email: currentEmail || "",
        sms_from_number: currentSmsNumber || "",
      });
    }
  }, [isOpen, currentEmail, currentSmsNumber, form]);

  const updateEmailMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!orgId) {
        throw new Error("Organization ID is required");
      }

      const { data: settings } = await supabase
        .from("company_settings")
        .select("id")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (!settings) throw new Error("Company settings not found");

      const result = await safeUpdate(
        "company_settings",
        { 
          support_email: data.support_email,
          sms_from_number: data.sms_from_number,
        },
        orgId,
        { id: settings.id }
      );

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings", orgId] });
      toast({
        title: "Success",
        description: "Customer contact information updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error updating support email:", error);
      toast({
        title: "Error",
        description: "Failed to update customer contact information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateEmailMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Customer Contact Information
          </DialogTitle>
          <DialogDescription>
            Update the contact information that customers will see on all communications
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="support_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="support@yourcompany.com" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This email will be displayed to customers on quotes, invoices, reminders, 
                    and all automated messages. Make sure it's actively monitored.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sms_from_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMS From Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="+1 (888) 721-3354" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This is the Twilio phone number that all SMS notifications will be sent from.
                    All customers will receive text messages from this number.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateEmailMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateEmailMutation.isPending}
              >
                {updateEmailMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
