
import React, { useState } from 'react';
import { Edit, Trash2, Mail, Phone, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditContactModal } from './EditContactModal';

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

  const handleDelete = () => {
    onDelete(contact.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className={`transition-all hover:shadow-md ${contact.is_primary ? 'ring-2 ring-primary ring-opacity-20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {contact.first_name} {contact.last_name}
                  </span>
                  {contact.is_primary && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>
                <Badge className={getContactTypeColor(contact.contact_type)}>
                  {contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1)}
                </Badge>
                {contact.is_primary && (
                  <Badge className="bg-gradient-to-r from-black to-gray-800 text-white border-0 font-bold">
                    Primary
                  </Badge>
                )}
              </div>

              {contact.title && (
                <p className="text-sm text-muted-foreground mb-2">{contact.title}</p>
              )}

              <div className="space-y-1">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${contact.email}`}
                      className="text-primary hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`tel:${contact.phone}`}
                      className="text-primary hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
              </div>

              {contact.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  {contact.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this contact? This action cannot be undone.
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
            </div>
          </div>
        </CardContent>
      </Card>

      <EditContactModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        contact={contact}
        customerId={customerId}
      />
    </>
  );
}
