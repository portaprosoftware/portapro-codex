
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  MapPin, 
  Navigation, 
  Edit, 
  Trash2,
  Filter
} from 'lucide-react';
import { AddDropPinModal } from './AddDropPinModal';
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

interface GPSDropPinsSectionProps {
  customerId: string;
}

export function GPSDropPinsSection({ customerId }: GPSDropPinsSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: serviceLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ['customer-service-locations', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', customerId);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: coordinates, isLoading: coordinatesLoading, refetch } = useQuery({
    queryKey: ['service-location-coordinates', customerId],
    queryFn: async () => {
      if (!serviceLocations || serviceLocations.length === 0) return [];
      
      const locationIds = serviceLocations.map(loc => loc.id);
      const { data, error } = await supabase
        .from('service_location_coordinates')
        .select('*')
        .in('service_location_id', locationIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!serviceLocations && serviceLocations.length > 0,
  });

  const { data: categories } = useQuery({
    queryKey: ['coordinate-categories', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_customer_categories', { customer_uuid: customerId });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDropPinAdded = () => {
    refetch();
    setIsAddModalOpen(false);
    toast({
      title: "Success",
      description: "GPS drop-pin added successfully",
    });
  };

  const handleDeleteCoordinate = async (coordinateId: string) => {
    try {
      const { error } = await supabase
        .from('service_location_coordinates')
        .delete()
        .eq('id', coordinateId);

      if (error) throw error;
      
      refetch();
      toast({
        title: "Success",
        description: "GPS drop-pin deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting coordinate:', error);
      toast({
        title: "Error",
        description: "Failed to delete GPS drop-pin",
        variant: "destructive",
      });
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  };

  const filteredCoordinates = coordinates?.filter(coord => {
    const matchesSearch = coord.point_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coord.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || coord.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categoryColors: Record<string, string> = {
    'units': 'bg-blue-100 text-blue-800 border-blue-200',
    'access': 'bg-green-100 text-green-800 border-green-200',
    'delivery': 'bg-orange-100 text-orange-800 border-orange-200',
    'parking': 'bg-purple-100 text-purple-800 border-purple-200',
    'utilities': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'other': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  if (locationsLoading || coordinatesLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted animate-pulse rounded-lg h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Manage GPS coordinates and drop-pins for service locations
        </p>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!serviceLocations || serviceLocations.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Drop-Pin
        </Button>
      </div>

      {!serviceLocations || serviceLocations.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No service locations</h3>
          <p className="text-muted-foreground">
            You need to create a service location first before adding GPS drop-pins
          </p>
        </div>
      ) : (
        <>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search drop-pins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {categories && categories.length > 0 && (
              <div className="flex gap-2 items-center">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex gap-1">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.category_name}
                      variant={selectedCategory === cat.category_name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.category_name)}
                    >
                      {cat.category_name} ({cat.point_count})
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coordinates List */}
          {filteredCoordinates.length > 0 ? (
            <div className="space-y-3">
              {filteredCoordinates.map((coordinate) => {
                const serviceLocation = serviceLocations.find(loc => loc.id === coordinate.service_location_id);
                
                return (
                  <Card key={coordinate.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-foreground">{coordinate.point_name}</h4>
                            {coordinate.category && (
                              <Badge className={categoryColors[coordinate.category] || categoryColors.other}>
                                {coordinate.category}
                              </Badge>
                            )}
                            {coordinate.is_primary && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Primary
                              </Badge>
                            )}
                          </div>

                          {coordinate.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {coordinate.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              <span>{coordinate.latitude}, {coordinate.longitude}</span>
                            </div>
                            {serviceLocation && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{serviceLocation.location_name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInMaps(coordinate.latitude, coordinate.longitude)}
                          >
                            <Navigation className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete GPS Drop-Pin</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{coordinate.point_name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteCoordinate(coordinate.id)}
                                  className="bg-red-600 hover:bg-red-700"
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
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No GPS drop-pins</h3>
              <p className="text-muted-foreground mb-4">
                Add your first GPS drop-pin to get started
              </p>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Drop-Pin
              </Button>
            </div>
          )}
        </>
      )}

      <AddDropPinModal
        customerId={customerId}
        serviceLocations={serviceLocations || []}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleDropPinAdded}
      />
    </div>
  );
}
