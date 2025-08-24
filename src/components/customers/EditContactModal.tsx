
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  contact_type: z.string().min(1, 'Contact type is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  is_primary: z.boolean().default(false),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface CustomerContact {
  id: string;
  customer_id: string;
  contact_type: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  notes?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: CustomerContact;
  customerId: string;
}

const CONTACT_TYPES = [
  { value: 'billing', label: 'Billing' },
  { value: 'onsite', label: 'On-Site' },
  { value: 'primary', label: 'Primary' },
  { value: 'emergency', label: 'Emergency' },
];

export function EditContactModal({ isOpen, onClose, contact, customerId }: EditContactModalProps) {
  const queryClient = useQueryClient();
  
  // Check for existing primary contact
  const { data: existingPrimaryContact } = useQuery({
    queryKey: ['primary-contact', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_contacts')
        .select('id')
        .eq('customer_id', customerId)
        .eq('is_primary', true)
        .neq('id', contact.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const hasPrimaryContact = !!existingPrimaryContact;
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: contact.first_name,
      last_name: contact.last_name,
      contact_type: contact.contact_type,
      email: contact.email || '',
      phone: contact.phone || '',
      title: contact.title || '',
      notes: contact.notes || '',
      is_primary: contact.is_primary,
    },
  });

  // Reset form when contact changes
  useEffect(() => {
    form.reset({
      first_name: contact.first_name,
      last_name: contact.last_name,
      contact_type: contact.contact_type,
      email: contact.email || '',
      phone: contact.phone || '',
      title: contact.title || '',
      notes: contact.notes || '',
      is_primary: contact.is_primary,
    });
  }, [contact, form]);

  const updateContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // If this is being set as primary, first unset any existing primary contacts
      if (data.is_primary && !contact.is_primary) {
        await supabase
          .from('customer_contacts')
          .update({ is_primary: false })
          .eq('customer_id', customerId)
          .eq('is_primary', true);
      }

      const { error } = await supabase
        .from('customer_contacts')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          contact_type: data.contact_type,
          email: data.email || null,
          phone: data.phone || null,
          title: data.title || null,
          notes: data.notes || null,
          is_primary: data.is_primary,
        })
        .eq('id', contact.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-contacts', customerId] });
      toast({
        title: "Contact updated",
        description: "The contact has been successfully updated.",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update the contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    updateContactMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
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
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contact_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTACT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Site Manager" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
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
                      <PhoneInput 
                        value={field.value} 
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_primary"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Set as primary contact</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!field.value && hasPrimaryContact}
                      />
                    </FormControl>
                  </div>
                  {!field.value && hasPrimaryContact && (
                    <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
                      <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Primary contact already selected for another contact - disable to enable this contact as primary
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateContactMutation.isPending}
              >
                {updateContactMutation.isPending ? 'Updating...' : 'Update Contact'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
