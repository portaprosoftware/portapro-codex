import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  support_email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface CustomerSupportEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string | null;
}

export const CustomerSupportEmailModal: React.FC<CustomerSupportEmailModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      support_email: currentEmail || "",
    },
  });

  React.useEffect(() => {
    if (isOpen && currentEmail !== undefined) {
      form.reset({
        support_email: currentEmail || "",
      });
    }
  }, [isOpen, currentEmail, form]);

  const updateEmailMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("id")
        .limit(1)
        .single();

      if (!settings) throw new Error("Company settings not found");

      const { error } = await supabase
        .from("company_settings")
        .update({ support_email: data.support_email })
        .eq("id", settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast({
        title: "Success",
        description: "Customer support email updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error updating support email:", error);
      toast({
        title: "Error",
        description: "Failed to update customer support email",
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
            Customer Support Email
          </DialogTitle>
          <DialogDescription>
            Update the email address that customers will see on all communications
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
