import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForQuery } from '@/lib/dateUtils';
import { InventoryLocation } from './useInventoryMarkerManager';

interface UseInventoryWithDateRangeProps {
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
  selectedLocationId?: string;
  selectedProductType?: string;
}

export const useInventoryWithDateRange = ({
  startDate,
  endDate,
  searchQuery,
  selectedLocationId = 'all',
  selectedProductType = 'all'
}: UseInventoryWithDateRangeProps) => {
  return useQuery({
    queryKey: ['inventory-locations-with-filters', {
      startDate: formatDateForQuery(startDate),
      endDate: formatDateForQuery(endDate),
      searchQuery,
      selectedLocationId,
      selectedProductType
    }],
    queryFn: async (): Promise<InventoryLocation[]> => {
      console.log('Fetching inventory locations with filters...');
      
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
        .in('jobs.status', ['assigned', 'in-progress', 'delivered']);

      // Apply date filters
      if (startDate) {
        query = query.gte('jobs.scheduled_date', formatDateForQuery(startDate));
      }
      if (endDate) {
        query = query.lte('jobs.scheduled_date', formatDateForQuery(endDate));
      }

      const { data: assignments, error } = await query;

      if (error) {
        console.error('Error fetching equipment assignments:', error);
        return [];
      }

      if (!assignments) return [];

      const locations: InventoryLocation[] = [];

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

      return locations;
    },
    enabled: true
  });
};