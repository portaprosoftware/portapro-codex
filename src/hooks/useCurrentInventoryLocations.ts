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

      const locations: InventoryLocation[] = [];
      console.log('📊 useCurrentInventoryLocations: Processing assignments...');

      assignments.forEach(assignment => {
        const job = assignment.jobs;
        const customer = job?.customers;
        const serviceLocations = customer?.customer_service_locations || [];
        
        serviceLocations.forEach(location => {
          let latitude: number | undefined;
          let longitude: number | undefined;
          
          if (location.gps_coordinates) {
            const coords = location.gps_coordinates as any;
            if (coords.x !== undefined && coords.y !== undefined) {
              longitude = coords.x;
              latitude = coords.y;
            }
          }
          
          const addressParts = [
            location.street,
            location.city,
            location.state,
            location.zip
          ].filter(Boolean);
          
          const product = assignment.products;
          const itemCode = assignment.product_items?.item_code || `${job.job_type} - Qty: ${assignment.quantity}`;
          
          if (latitude && longitude && product) {
            const inventoryLocation: InventoryLocation = {
              id: `${assignment.id}-${location.id}`,
              product_name: product.name,
              item_code: itemCode,
              status: assignment.status,
              customer_name: customer?.name || 'Unknown Customer',
              customer_address: addressParts.join(', ') || location.location_name || 'No address',
              latitude,
              longitude,
              job_type: job.job_type,
              scheduled_date: job.scheduled_date,
              customer_phone: customer?.phone,
              quantity: assignment.quantity || 1
            };

            // Apply filters
            let shouldInclude = true;

            // Search filter
            if (searchQuery && searchQuery.trim()) {
              const search = searchQuery.toLowerCase();
              shouldInclude = shouldInclude && (
                inventoryLocation.product_name.toLowerCase().includes(search) ||
                inventoryLocation.item_code.toLowerCase().includes(search) ||
                inventoryLocation.customer_name.toLowerCase().includes(search)
              );
            }

            // Location filter
            if (selectedLocationId !== 'all') {
              shouldInclude = shouldInclude && location.id === selectedLocationId;
            }

            // Product type filter
            if (selectedProductType !== 'all') {
              shouldInclude = shouldInclude && inventoryLocation.product_name === selectedProductType;
            }

            if (shouldInclude) {
              locations.push(inventoryLocation);
            }
          }
        });
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