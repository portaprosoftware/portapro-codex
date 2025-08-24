import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StaffCertificationsCard: React.FC = () => {
  const navigate = useNavigate();
  const { data: certificationsData } = useQuery({
    queryKey: ['dashboard-staff-certifications'],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const { data, error } = await supabase
        .from('employee_certifications')
        .select('driver_clerk_id, expires_on')
        .lte('expires_on', futureDate.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const uniqueEmployees = new Set(data?.map(cert => cert.driver_clerk_id));
      
      return {
        totalCertifications: data?.length || 0,
        affectedEmployees: uniqueEmployees.size
      };
    }
  });

  return (
    <StatCard
      title="Staff Certifications"
      value={certificationsData?.totalCertifications || 0}
      icon={Award}
      gradientFrom="#10b981"
      gradientTo="#059669"
      iconBg="#10b981"
      subtitle={`${certificationsData?.affectedEmployees || 0} staff affected`}
      subtitleColor="text-green-600"
      delay={400}
      clickable
      onClick={() => navigate('/team-management')}
    />
  );
};