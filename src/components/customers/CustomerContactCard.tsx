
import React, { useState } from 'react';
import { Edit, Trash2, Mail, Phone, Star, User, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EditContactModal } from './EditContactModal';
import { formatPhoneNumber } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

interface CustomerContactCardProps {
  contact: CustomerContact;
  onDelete: (contactId: string) => void;
  customerId: string;
}

export function CustomerContactCard({ contact, onDelete, customerId }: CustomerContactCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  const getContactTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'billing': return 'bg-gradient-to-r from-green-600 to-green-700 text-white border-0 font-bold';
      case 'on-site': return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 font-bold';
      case 'emergency': return 'bg-gradient-to-r from-red-600 to-red-700 text-white border-0 font-bold';
      case 'management': return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0 font-bold';
      case 'operations': return 'bg-gradient-to-r from-orange-600 to-orange-700 text-white border-0 font-bold';
      default: return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0 font-bold';
    }
  };

  const formatContactTypeName = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleDelete = () => {
    onDelete(contact.id);
    setShowDeleteDialog(false);
  };

  const makePrimaryMutation = useMutation({
    mutationFn: async () => {
      // First, unset any existing primary contact
      await supabase
        .from('customer_contacts')
        .update({ is_primary: false })
        .eq('customer_id', customerId);

      // Then set this contact as primary
      const { error } = await supabase
        .from('customer_contacts')
        .update({ is_primary: true })
        .eq('id', contact.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-contacts', customerId] });
      toast({
        title: "Primary contact updated",
        description: `${contact.first_name} ${contact.last_name} is now the primary contact.`,
      });
    },
    onError: (error) => {
      console.error('Error setting primary contact:', error);
      toast({
        title: "Error",
        description: "Failed to set primary contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getInitials = () => {
    return `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <Card className={`transition-all hover:shadow-md ${contact.is_primary ? 'ring-2 ring-primary' : ''} rounded-xl`}>
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            {/* Avatar with Initials */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base">
              {getInitials()}
            </div>

            {/* Contact Information */}
            <div className="flex-1 min-w-0">
              {/* Name Row with Star */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold text-foreground text-base leading-tight">
                  {contact.first_name} {contact.last_name}
                </h4>
                {contact.is_primary && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" aria-label="Primary contact" />
                )}
              </div>

              {/* Title/Role */}
              {contact.title && (
                <p className="text-sm text-muted-foreground mb-2">{contact.title}</p>
              )}

              {/* Badges Row */}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <Badge className={`${getContactTypeColor(contact.contact_type)} text-xs`}>
                  {formatContactTypeName(contact.contact_type)}
                </Badge>
                {contact.is_primary && (
                  <Badge className="bg-gradient-to-r from-black to-gray-800 text-white border-0 font-bold text-xs">
                    Primary
                  </Badge>
                )}
              </div>

              {/* Contact Methods */}
              <div className="space-y-1.5">
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`mailto:${contact.email}`}
                      className="text-primary hover:underline text-sm break-all"
                      aria-label={`Email ${contact.first_name} ${contact.last_name}`}
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`tel:${contact.phone}`}
                      className="text-primary hover:underline text-sm"
                      aria-label={`Call ${contact.first_name} ${contact.last_name}`}
                    >
                      {formatPhoneNumber(contact.phone)}
                    </a>
                  </div>
                )}
              </div>

              {/* Notes */}
              {contact.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic line-clamp-2">
                  {contact.notes}
                </p>
              )}
            </div>

            {/* Kebab Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 flex-shrink-0"
                  aria-label="Contact actions"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {!contact.is_primary && (
                  <DropdownMenuItem onClick={() => makePrimaryMutation.mutate()}>
                    <Star className="w-4 h-4 mr-2" />
                    Make Primary
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contact.first_name} {contact.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Modal */}
      <EditContactModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        contact={contact}
        customerId={customerId}
      />
    </>
  );
}
