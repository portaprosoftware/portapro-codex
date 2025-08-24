import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DriverCredentialsCard: React.FC = () => {
  const navigate = useNavigate();
  const { data: credentialsData } = useQuery({
    queryKey: ['dashboard-driver-credentials'],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const { data, error } = await supabase
        .from('driver_credentials')
        .select('driver_id, license_expiry_date, medical_card_expiry_date')
        .or(`license_expiry_date.lte.${futureDate.toISOString().split('T')[0]},medical_card_expiry_date.lte.${futureDate.toISOString().split('T')[0]}`);
      
      if (error) throw error;
      
      const uniqueDrivers = new Set(data?.map(cred => cred.driver_id));
      
      const totalCredentialIssues = data?.reduce((count, cred) => {
        let issues = 0;
        if (cred.license_expiry_date && new Date(cred.license_expiry_date) <= futureDate) issues++;
        if (cred.medical_card_expiry_date && new Date(cred.medical_card_expiry_date) <= futureDate) issues++;
        return count + issues;
      }, 0) || 0;
      
      return {
        totalCredentials: totalCredentialIssues,
        affectedDrivers: uniqueDrivers.size
      };
    }
  });

  return (
    <StatCard
      title="Driver Credentials"
      value={credentialsData?.totalCredentials || 0}
      icon={CreditCard}
      gradientFrom="#fbbf24"
      gradientTo="#f59e0b"
      iconBg="#fbbf24"
      subtitle={`${credentialsData?.affectedDrivers || 0} drivers affected`}
      subtitleColor="text-yellow-600"
      delay={300}
      clickable
      onClick={() => navigate('/team-management')}
    />
  );
};