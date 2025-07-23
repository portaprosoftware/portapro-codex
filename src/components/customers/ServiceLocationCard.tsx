
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Edit, 
  Trash2, 
  ExternalLink,
  Lock,
  Star
} from 'lucide-react';
import { EditServiceLocationModal } from './EditServiceLocationModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ServiceLocationCardProps {
  location: any;
  onUpdate: () => void;
  onDelete: () => void;
}

export function ServiceLocationCard({ location, onUpdate, onDelete }: ServiceLocationCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const fullAddress = [
    location.street,
    location.street2,
    location.city,
    location.state,
    location.zip
  ].filter(Boolean).join(', ');

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('customer_service_locations')
        .delete()
        .eq('id', location.id);

      if (error) throw error;
      onDelete();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete service location",
        variant: "destructive",
      });
    }
  };

  const openInGoogleMaps = () => {
    const encoded = encodeURIComponent(fullAddress);
    window.open(`https://maps.google.com/?q=${encoded}`, '_blank');
  };

  const openInAppleMaps = () => {
    const encoded = encodeURIComponent(fullAddress);
    window.open(`http://maps.apple.com/?q=${encoded}`, '_blank');
  };

  const openInWaze = () => {
    const encoded = encodeURIComponent(fullAddress);
    window.open(`https://www.waze.com/ul?q=${encoded}`, '_blank');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-foreground">{location.location_name}</h4>
              <div className="flex gap-1">
                {location.is_default && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
                {location.is_locked && (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                )}
                {location.is_active ? (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
            </div>

            {location.location_description && (
              <p className="text-sm text-muted-foreground mb-3">
                {location.location_description}
              </p>
            )}

            <div className="flex items-start gap-2 mb-4">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-foreground">{fullAddress}</p>
                {location.access_instructions && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Access:</strong> {location.access_instructions}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openInGoogleMaps}
                className="text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Google Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInAppleMaps}
                className="text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Apple Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInWaze}
                className="text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Waze
              </Button>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            {!location.is_locked && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Service Location</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{location.location_name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <EditServiceLocationModal
          location={location}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            onUpdate();
          }}
        />
      </CardContent>
    </Card>
  );
}
