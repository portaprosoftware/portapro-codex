import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { FileX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VehicleDocumentsCard: React.FC = () => {
  const navigate = useNavigate();
  const { data: vehicleDocsData } = useQuery({
    queryKey: ['dashboard-vehicle-docs'],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const { data, error } = await supabase
        .from('vehicle_compliance_documents')
        .select('vehicle_id, expiration_date')
        .lte('expiration_date', futureDate.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const uniqueVehicles = new Set(data?.map(doc => doc.vehicle_id));
      
      return {
        totalDocuments: data?.length || 0,
        affectedVehicles: uniqueVehicles.size
      };
    }
  });

  return (
    <StatCard
      title="Vehicle Documents"
      value={vehicleDocsData?.totalDocuments || 0}
      icon={FileX}
      gradientFrom="#dc2626"
      gradientTo="#b91c1c"
      iconBg="#dc2626"
      subtitle={`${vehicleDocsData?.affectedVehicles || 0} vehicles affected`}
      subtitleColor="text-red-600"
      delay={100}
      clickable
      onClick={() => navigate('/fleet/compliance')}
    />
  );
};