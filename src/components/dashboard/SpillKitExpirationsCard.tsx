import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';

export const SpillKitExpirationsCard: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: expirationData } = useQuery({
    queryKey: ['dashboard-spill-kit-expirations'],
    queryFn: async () => {
      const { data: checks, error } = await supabase
        .from('vehicle_spill_kit_checks')
        .select('id, vehicle_id, has_kit, item_conditions, created_at')
        .eq('has_kit', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const today = new Date();
      const latestExpirations = new Map<string, any>();

      checks?.forEach((check) => {
        const conditions = check.item_conditions as any;
        if (!conditions) return;

        Object.entries(conditions).forEach(([itemId, condition]: [string, any]) => {
          if (condition.expiration_date) {
            const key = `${check.vehicle_id}-${condition.item_name || itemId}`;
            const existing = latestExpirations.get(key);
            
            if (!existing || new Date(check.created_at) > new Date(existing.created_at)) {
              latestExpirations.set(key, {
                expiration_date: condition.expiration_date,
                created_at: check.created_at
              });
            }
          }
        });
      });

      // Count items expiring within 30 days (including expired)
      let expiringCount = 0;
      latestExpirations.forEach((item) => {
        const expiryDate = parseISO(item.expiration_date);
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        if (daysUntilExpiry <= 30) {
          expiringCount++;
        }
      });

      return {
        totalExpiring: expiringCount,
      };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  return (
    <StatCard
      title="Spill Kit Expirations"
      value={expirationData?.totalExpiring || 0}
      icon={Shield}
      gradientFrom="#f97316"
      gradientTo="#dc2626"
      iconBg="#f97316"
      subtitle="Kits expiring within 30 days"
      subtitleColor="text-orange-600"
      delay={400}
      clickable
      onClick={() => navigate('/fleet/compliance')}
    />
  );
};
