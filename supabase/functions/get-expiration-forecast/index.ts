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
    console.log('Generating expiration forecast...');

    const today = new Date();
    const thirtyDays = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const sixtyDays = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000));
    const ninetyDays = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));

    // Fetch all driver credentials
    const { data: credentials, error: credError } = await supabase
      .from('driver_credentials')
      .select(`
        license_expiry_date,
        medical_card_expiry_date,
        profiles!inner(id, first_name, last_name)
      `);

    if (credError) throw credError;

    // Fetch all training records
    const { data: trainings, error: trainError } = await supabase
      .from('driver_training_records')
      .select(`
        next_due,
        training_type,
        profiles!inner(id, first_name, last_name)
      `);

    if (trainError) throw trainError;

    // Generate forecast data for the next 90 days
    const forecasts = [];
    const periods = [
      { label: 'Next 30 Days', date: thirtyDays, range: { start: today, end: thirtyDays } },
      { label: 'Days 31-60', date: sixtyDays, range: { start: thirtyDays, end: sixtyDays } },
      { label: 'Days 61-90', date: ninetyDays, range: { start: sixtyDays, end: ninetyDays } }
    ];

    let totalUpcoming = 0;
    let highRiskPeriods = 0;
    let peakMonth = null;
    let maxExpirationsInMonth = 0;

    for (const period of periods) {
      // Count license expirations in this period
      const licenseExpirations = credentials?.filter(cred => {
        if (!cred.license_expiry_date) return false;
        const expiry = new Date(cred.license_expiry_date);
        return expiry >= period.range.start && expiry <= period.range.end;
      }).length || 0;

      // Count medical card expirations in this period
      const medicalExpirations = credentials?.filter(cred => {
        if (!cred.medical_card_expiry_date) return false;
        const expiry = new Date(cred.medical_card_expiry_date);
        return expiry >= period.range.start && expiry <= period.range.end;
      }).length || 0;

      // Count training expirations in this period
      const trainingExpirations = trainings?.filter(training => {
        if (!training.next_due) return false;
        const due = new Date(training.next_due);
        return due >= period.range.start && due <= period.range.end;
      }).length || 0;

      const totalRisk = licenseExpirations + medicalExpirations + trainingExpirations;
      totalUpcoming += totalRisk;

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (totalRisk >= 10) riskLevel = 'high';
      else if (totalRisk >= 5) riskLevel = 'medium';

      if (riskLevel === 'high') highRiskPeriods++;

      // Track peak month
      if (totalRisk > maxExpirationsInMonth) {
        maxExpirationsInMonth = totalRisk;
        peakMonth = period.date.toISOString();
      }

      // Determine trends (simplified - in real implementation, would compare with historical data)
      const getTrend = (count: number) => {
        if (count >= 5) return 'up';
        if (count <= 1) return 'down';
        return 'stable';
      };

      forecasts.push({
        period: period.label,
        date: period.date.toISOString(),
        licenses: {
          expiring: licenseExpirations,
          trend: getTrend(licenseExpirations)
        },
        medical: {
          expiring: medicalExpirations,
          trend: getTrend(medicalExpirations)
        },
        training: {
          expiring: trainingExpirations,
          trend: getTrend(trainingExpirations)
        },
        totalRisk,
        riskLevel
      });
    }

    // Generate recommendation
    let recommendation = '';
    if (highRiskPeriods > 0) {
      recommendation = `${highRiskPeriods} high-risk period(s) detected. Consider proactive renewal scheduling and additional reminder campaigns.`;
    } else if (totalUpcoming > 15) {
      recommendation = 'Moderate expiration volume upcoming. Monitor closely and ensure renewal processes are efficient.';
    } else {
      recommendation = 'Expiration forecast looks manageable. Continue with standard monitoring and renewal processes.';
    }

    const summary = {
      totalUpcoming,
      highRiskPeriods,
      peakMonth,
      recommendation
    };

    console.log(`Generated forecast: ${forecasts.length} periods, ${totalUpcoming} total upcoming`);

    return new Response(JSON.stringify({
      success: true,
      forecasts,
      summary,
      generatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Get expiration forecast error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Failed to generate expiration forecast'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);