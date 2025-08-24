import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DriverDocumentsCard: React.FC = () => {
  const navigate = useNavigate();
  const { data: driverDocsData } = useQuery({
    queryKey: ['dashboard-driver-docs'],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const { data, error } = await supabase
        .from('driver_documents')
        .select('driver_id, expiry_date')
        .lte('expiry_date', futureDate.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const uniqueDrivers = new Set(data?.map(doc => doc.driver_id));
      
      return {
        totalDocuments: data?.length || 0,
        affectedDrivers: uniqueDrivers.size
      };
    }
  });

  return (
    <StatCard
      title="Driver Documents"
      value={driverDocsData?.totalDocuments || 0}
      icon={FileText}
      gradientFrom="#ea580c"
      gradientTo="#c2410c"
      iconBg="#ea580c"
      subtitle={`${driverDocsData?.affectedDrivers || 0} drivers affected`}
      subtitleColor="text-orange-600"
      delay={200}
      clickable
      onClick={() => navigate('/team-management')}
    />
  );
};