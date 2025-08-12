import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching compliance statistics...');

    // Get total driver count from user_roles table
    const { count: totalDrivers, error: driversError } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'driver');

    if (driversError) throw driversError;

    // Get license compliance stats
    const { data: licenses, error: licenseError } = await supabase
      .from('driver_credentials')
      .select(`
        license_expiry_date,
        driver_id
      `);

    if (licenseError) throw licenseError;

    // Get medical card compliance stats
    const { data: medicalCards, error: medicalError } = await supabase
      .from('driver_credentials')
      .select(`
        medical_card_expiry_date,
        driver_id
      `)
      .not('medical_card_expiry_date', 'is', null);

    if (medicalError) throw medicalError;

    // Get training compliance stats
    const { data: trainings, error: trainingError } = await supabase
      .from('driver_training_records')
      .select(`
        next_due,
        last_completed,
        driver_id
      `);

    if (trainingError) throw trainingError;

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Calculate license compliance
    const licenseStats = {
      total: licenses?.length || 0,
      current: 0,
      expiringSoon: 0,
      expired: 0,
      missing: (totalDrivers || 0) - (licenses?.length || 0)
    };

    licenses?.forEach(license => {
      if (!license.license_expiry_date) return;
      
      const expiryDate = new Date(license.license_expiry_date);
      if (expiryDate < today) {
        licenseStats.expired++;
      } else if (expiryDate <= thirtyDaysFromNow) {
        licenseStats.expiringSoon++;
      } else {
        licenseStats.current++;
      }
    });

    // Calculate medical card compliance
    const medicalStats = {
      total: medicalCards?.length || 0,
      current: 0,
      expiringSoon: 0,
      expired: 0,
      missing: (totalDrivers || 0) - (medicalCards?.length || 0)
    };

    medicalCards?.forEach(medical => {
      if (!medical.medical_card_expiry_date) return;
      
      const expiryDate = new Date(medical.medical_card_expiry_date);
      if (expiryDate < today) {
        medicalStats.expired++;
      } else if (expiryDate <= thirtyDaysFromNow) {
        medicalStats.expiringSoon++;
      } else {
        medicalStats.current++;
      }
    });

    // Calculate training compliance
    const trainingStats = {
      total: trainings?.length || 0,
      current: 0,
      expiringSoon: 0,
      expired: 0,
      missing: (totalDrivers || 0) - (trainings?.length || 0)
    };

    trainings?.forEach(training => {
      if (!training.next_due) {
        trainingStats.current++;
        return;
      }
      
      const dueDate = new Date(training.next_due);
      if (dueDate < today) {
        trainingStats.expired++;
      } else if (dueDate <= thirtyDaysFromNow) {
        trainingStats.expiringSoon++;
      } else {
        trainingStats.current++;
      }
    });

    // Calculate overall compliance
    const totalCompliant = licenseStats.current + medicalStats.current + trainingStats.current;
    const totalExpiringSoon = licenseStats.expiringSoon + medicalStats.expiringSoon + trainingStats.expiringSoon;
    const totalExpired = licenseStats.expired + medicalStats.expired + trainingStats.expired;
    const totalDocuments = licenseStats.total + medicalStats.total + trainingStats.total;
    
    const complianceRate = totalDocuments > 0 ? Math.round((totalCompliant / totalDocuments) * 100) : 0;

    const stats = {
      totalDrivers: totalDrivers || 0,
      compliantDrivers: totalCompliant,
      expiringSoon: totalExpiringSoon,
      expired: totalExpired,
      complianceRate,
      documentTypes: [
        {
          type: 'Driver Licenses',
          total: licenseStats.total + licenseStats.missing,
          compliant: licenseStats.current,
          expiring: licenseStats.expiringSoon,
          expired: licenseStats.expired,
          missing: licenseStats.missing
        },
        {
          type: 'Medical Cards',
          total: medicalStats.total + medicalStats.missing,
          compliant: medicalStats.current,
          expiring: medicalStats.expiringSoon,
          expired: medicalStats.expired,
          missing: medicalStats.missing
        },
        {
          type: 'Training Records',
          total: trainingStats.total + trainingStats.missing,
          compliant: trainingStats.current,
          expiring: trainingStats.expiringSoon,
          expired: trainingStats.expired,
          missing: trainingStats.missing
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    console.log('Compliance stats calculated:', stats);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Get compliance stats error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: 'Failed to fetch compliance statistics'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);