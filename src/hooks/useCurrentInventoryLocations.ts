import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InventoryLocation } from './useInventoryMarkerManager';

interface UseCurrentInventoryLocationsProps {
  searchQuery?: string;
  selectedLocationId?: string;
  selectedProductType?: string;
}

export const useCurrentInventoryLocations = ({
  searchQuery,
  selectedLocationId = 'all',
  selectedProductType = 'all'
}: UseCurrentInventoryLocationsProps) => {
  console.log('📊 useCurrentInventoryLocations: Hook called with params:', {
    searchQuery,
    selectedLocationId,
    selectedProductType
  });

  return useQuery({
    queryKey: ['current-inventory-locations', {
      searchQuery,
      selectedLocationId,
      selectedProductType
    }],
    queryFn: async (): Promise<InventoryLocation[]> => {
      console.log('📊 useCurrentInventoryLocations: Starting data fetch...');
      
      let query = supabase
        .from('equipment_assignments')
        .select(`
          id,
          job_id,
          product_id,
          product_item_id,
          quantity,
          status,
          assigned_date,
          jobs!inner(
            id,
            job_type,
            scheduled_date,
            status,
            customer_id,
            customers!inner(
              id,
              name,
              phone,
              customer_service_locations!customer_id(
                id,
                location_name,
                street,
                city,
                state,
                zip,
                gps_coordinates
              )
            )
          ),
          products(
            id,
            name
          ),
          product_items(
            id,
            item_code
          )
        `)
        .in('status', ['assigned', 'delivered', 'in_service'])
        .in('jobs.status', ['assigned', 'in-progress']);

      console.log('📊 useCurrentInventoryLocations: Executing query...');
      const { data: assignments, error } = await query;

      console.log('📊 useCurrentInventoryLocations: Query result:', { 
        assignmentsCount: assignments?.length || 0, 
        error,
        sampleData: assignments?.slice(0, 2)
      });

      if (error) {
        console.error('📊 useCurrentInventoryLocations: Query error:', error);
        return [];
      }

      if (!assignments) {
        console.log('📊 useCurrentInventoryLocations: No assignments returned');
        return [];
      }

      // Group inventory items by location coordinates
      const locationGroups = new Map<string, {
        coordinate: { latitude: number; longitude: number };
        items: Array<{
          id: string;
          product_name: string;
          item_code: string;
          status: string;
          quantity: number;
          job_type: string;
          scheduled_date: string;
        }>;
        customer_name: string;
        customer_address: string;
        customer_phone?: string;
        location_name: string;
      }>();

      console.log('📊 useCurrentInventoryLocations: Processing assignments...');

      assignments.forEach(assignment => {
        const job = assignment.jobs;
        const customer = job?.customers;
        const serviceLocations = customer?.customer_service_locations || [];
        
        serviceLocations.forEach(location => {
          let latitude: number | undefined;
          let longitude: number | undefined;
          
          if (location.gps_coordinates) {
            // Handle PostgreSQL POINT format: "(x,y)" where x=longitude, y=latitude
            const coords = location.gps_coordinates as any;
            
            // Check for .x/.y properties first (JSON format)
            if (coords.x !== undefined && coords.y !== undefined) {
              longitude = coords.x;
              latitude = coords.y;
            }
            // Handle PostgreSQL POINT string format "(lng,lat)"
            else if (typeof coords === 'string') {
              const match = coords.match(/\(([^,]+),([^)]+)\)/);
              if (match) {
                longitude = parseFloat(match[1]);
                latitude = parseFloat(match[2]);
              }
            }
            // Handle array format [lng, lat]
            else if (Array.isArray(coords) && coords.length >= 2) {
              longitude = coords[0];
              latitude = coords[1];
            }
            
            console.log('📊 GPS parsing:', { 
              raw: coords, 
              parsed: { longitude, latitude },
              location: location.location_name 
            });
          }
          
          // Only process locations with valid GPS coordinates
          if (latitude && longitude) {
            const addressParts = [
              location.street,
              location.city,
              location.state,
              location.zip
            ].filter(Boolean);
            
            // Get product info from either products or product_items
            let product = assignment.products;
            let productName = product?.name;
            
            // If no product from direct relation, try to get from product_items
            if (!productName && assignment.product_items?.id) {
              productName = assignment.product_items.item_code || 'Unknown Product';
            }
            
            // Fallback to job type if no product name available
            if (!productName) {
              productName = `${job.job_type} Equipment`;
            }
            
            const itemCode = assignment.product_items?.item_code || `${job.job_type} - Qty: ${assignment.quantity}`;
            
            // Apply filters on individual items before grouping
            let shouldInclude = true;

            // Search filter
            if (searchQuery && searchQuery.trim()) {
              const search = searchQuery.toLowerCase();
              shouldInclude = shouldInclude && (
                productName.toLowerCase().includes(search) ||
                itemCode.toLowerCase().includes(search) ||
                (customer?.name || '').toLowerCase().includes(search)
              );
            }

            // Location filter
            if (selectedLocationId !== 'all') {
              shouldInclude = shouldInclude && location.id === selectedLocationId;
            }

            // Product type filter
            if (selectedProductType !== 'all') {
              shouldInclude = shouldInclude && productName === selectedProductType;
            }

            if (shouldInclude) {
              // Create a unique key for this location (coordinates + customer)
              const locationKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}-${customer?.id || 'unknown'}`;
              
              if (!locationGroups.has(locationKey)) {
                locationGroups.set(locationKey, {
                  coordinate: { latitude, longitude },
                  items: [],
                  customer_name: customer?.name || 'Unknown Customer',
                  customer_address: addressParts.join(', ') || location.location_name || 'No address',
                  customer_phone: customer?.phone,
                  location_name: location.location_name
                });
              }
              
              const group = locationGroups.get(locationKey)!;
              group.items.push({
                id: assignment.id,
                product_name: productName,
                item_code: itemCode,
                status: assignment.status,
                quantity: assignment.quantity || 1,
                job_type: job.job_type,
                scheduled_date: job.scheduled_date
              });
            }
          }
        });
      });

      // Convert grouped data to InventoryLocation format
      const locations: InventoryLocation[] = [];
      locationGroups.forEach((group, locationKey) => {
        const totalQuantity = group.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Determine primary status (most common or most critical)
        const statusCounts = group.items.reduce((counts, item) => {
          counts[item.status] = (counts[item.status] || 0) + 1;
          return counts;
        }, {} as Record<string, number>);
        
        const primaryStatus = Object.entries(statusCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'available';
        
        // Use the first item for display purposes, but include all items
        const firstItem = group.items[0];
        
        locations.push({
          id: locationKey,
          product_name: group.items.length > 1 ? `${group.items.length} Items` : firstItem.product_name,
          item_code: group.items.length > 1 ? 'Multiple Items' : firstItem.item_code,
          status: primaryStatus,
          customer_name: group.customer_name,
          customer_address: group.customer_address,
          latitude: group.coordinate.latitude,
          longitude: group.coordinate.longitude,
          job_type: firstItem.job_type,
          scheduled_date: firstItem.scheduled_date,
          customer_phone: group.customer_phone,
          quantity: totalQuantity,
          items: group.items // Add the individual items for popup display
        } as InventoryLocation & { items: typeof group.items });
      });

      console.log('📊 useCurrentInventoryLocations: Final locations:', {
        totalLocations: locations.length,
        sampleLocations: locations.slice(0, 2)
      });
      
      return locations;
    },
    enabled: true
  });
};