import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DriverComplianceCard: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: complianceData } = useQuery({
    queryKey: ['dashboard-driver-compliance'],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      // Fetch driver documents
      const { data: docsData, error: docsError } = await supabase
        .from('driver_documents')
        .select('driver_id, expiry_date')
        .lte('expiry_date', futureDateStr);
      
      if (docsError) throw docsError;
      
      // Fetch driver credentials
      const { data: credsData, error: credsError } = await supabase
        .from('driver_credentials')
        .select('driver_id, license_expiry_date, medical_card_expiry_date')
        .or(`license_expiry_date.lte.${futureDateStr},medical_card_expiry_date.lte.${futureDateStr}`);
      
      if (credsError) throw credsError;
      
      // Count total documents
      const totalDocuments = docsData?.length || 0;
      
      // Count total credential issues
      const totalCredentialIssues = credsData?.reduce((count, cred) => {
        let issues = 0;
        if (cred.license_expiry_date && new Date(cred.license_expiry_date) <= futureDate) issues++;
        if (cred.medical_card_expiry_date && new Date(cred.medical_card_expiry_date) <= futureDate) issues++;
        return count + issues;
      }, 0) || 0;
      
      // Combine unique drivers from both sources
      const affectedDrivers = new Set([
        ...(docsData?.map(doc => doc.driver_id) || []),
        ...(credsData?.map(cred => cred.driver_id) || [])
      ]);
      
      return {
        totalIssues: totalDocuments + totalCredentialIssues,
        affectedDrivers: affectedDrivers.size
      };
    }
  });

  return (
    <StatCard
      title="Driver Compliance"
      value={complianceData?.totalIssues || 0}
      icon={FileText}
      gradientFrom="#ea580c"
      gradientTo="#f59e0b"
      iconBg="#ea580c"
      subtitle={`${complianceData?.affectedDrivers || 0} drivers affected`}
      subtitleColor="text-orange-600"
      delay={200}
      clickable
      onClick={() => navigate('/team-management')}
    />
  );
};
