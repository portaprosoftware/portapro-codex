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
  Star,
  Copy
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

  const hasGpsCoordinates = location.gps_coordinates !== null;

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('customer_service_locations')
        .delete()
        .eq('id', location.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Service location deleted successfully",
      });
      
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
    const url = `https://maps.google.com/?q=${encoded}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInAppleMaps = () => {
    const encoded = encodeURIComponent(fullAddress);
    const url = `https://maps.apple.com/?q=${encoded}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInWaze = () => {
    const encoded = encodeURIComponent(fullAddress);
    const url = `https://www.waze.com/ul?q=${encoded}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress).then(() => {
      toast({
        title: "Address Copied",
        description: "Address copied to clipboard",
      });
    }).catch((error) => {
      console.error('Failed to copy address:', error);
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive",
      });
    });
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
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 font-bold px-3 py-1 rounded-full">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
                {location.is_locked && (
                  <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 font-bold px-3 py-1 rounded-full">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
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
              <div className="flex-1">
                <p className="text-sm text-foreground select-text">{fullAddress}</p>
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyAddress}
              className="flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </Button>
            {!location.is_locked && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Service Location</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>Are you sure you want to delete "{location.location_name}"?</p>
                        {location.is_default && (
                          <p className="text-yellow-600 font-medium">
                            ⚠️ This is the default service location for this customer.
                          </p>
                        )}
                        {location.is_locked && (
                          <p className="text-orange-600 font-medium">
                            🔒 This is a system-generated location based on the customer's service address.
                          </p>
                        )}
                        <p className="text-red-600">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Delete Location
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {!location.is_locked && (
          <EditServiceLocationModal
            location={location}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              setIsEditModalOpen(false);
              onUpdate();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}