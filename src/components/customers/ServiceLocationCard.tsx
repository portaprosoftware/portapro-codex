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
        duration: 2000,
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
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header Section */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground break-words">{location.location_name}</h4>
            
            {/* Badges - Wrapping with gaps */}
            <div className="flex flex-wrap gap-1.5">
              {location.is_default && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  <Star className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}
              {location.is_locked && (
                <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {location.location_description && (
            <p className="text-sm text-muted-foreground break-words">
              {location.location_description}
            </p>
          )}

          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground select-text break-words whitespace-normal">{fullAddress}</p>
              {location.access_instructions && (
                <p className="text-xs text-muted-foreground mt-1 break-words">
                  <strong>Access:</strong> {location.access_instructions}
                </p>
              )}
            </div>
          </div>

          {/* Map Action Buttons - Responsive Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:flex md:flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyAddress}
              className="text-xs min-h-[36px] justify-start w-full md:w-auto"
            >
              <Copy className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Copy Address</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInGoogleMaps}
              className="text-xs min-h-[36px] justify-start w-full md:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Google Maps</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInAppleMaps}
              className="text-xs min-h-[36px] justify-start w-full md:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Apple Maps</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInWaze}
              className="text-xs min-h-[36px] justify-start w-full md:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Waze</span>
            </Button>
          </div>

          {/* Edit/Delete Actions - Bottom Row */}
          {!location.is_locked && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 min-h-[36px]"
              >
                <Edit className="w-4 h-4 mr-2" />
                <span>Edit</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 min-h-[36px]">
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span>Delete</span>
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
            </div>
          )}
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
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Card>
  );
}