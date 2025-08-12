import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportFilters {
  dateRange: {
    from: string | undefined;
    to: string | undefined;
  };
  status: string;
  documentTypes: string[];
  format: 'csv' | 'pdf';
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filters }: { filters: ExportFilters } = await req.json();
    console.log('Exporting compliance data with filters:', filters);

    const records: any[] = [];

    // Fetch driver credentials if license type is selected
    if (filters.documentTypes.includes('license')) {
      const { data: licenses, error: licenseError } = await supabase
        .from('driver_credentials')
        .select(`
          driver_id,
          license_number,
          license_state,
          license_class,
          license_expiry_date,
          profiles!inner(first_name, last_name, email)
        `);

      if (licenseError) throw licenseError;

      licenses?.forEach(license => {
        const profile = Array.isArray(license.profiles) ? license.profiles[0] : license.profiles;
        const expiryDate = new Date(license.license_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        let status = 'current';
        if (daysUntilExpiry < 0) status = 'expired';
        else if (daysUntilExpiry <= 30) status = 'expiring';

        // Apply status filter
        if (filters.status !== 'all' && filters.status !== status) return;

        // Apply date range filter
        if (filters.dateRange.from && expiryDate < new Date(filters.dateRange.from)) return;
        if (filters.dateRange.to && expiryDate > new Date(filters.dateRange.to)) return;

        records.push({
          document_type: 'Driver License',
          driver_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          driver_email: profile?.email || '',
          document_id: license.license_number,
          state: license.license_state,
          class: license.license_class,
          expiry_date: license.license_expiry_date,
          days_until_expiry: daysUntilExpiry,
          status: status,
          compliance_status: status === 'current' ? 'Compliant' : status === 'expiring' ? 'Action Required' : 'Non-Compliant'
        });
      });
    }

    // Fetch medical cards if medical type is selected
    if (filters.documentTypes.includes('medical')) {
      const { data: medicals, error: medicalError } = await supabase
        .from('driver_credentials')
        .select(`
          driver_id,
          medical_card_reference,
          medical_card_expiry_date,
          profiles!inner(first_name, last_name, email)
        `)
        .not('medical_card_expiry_date', 'is', null);

      if (medicalError) throw medicalError;

      medicals?.forEach(medical => {
        const profile = Array.isArray(medical.profiles) ? medical.profiles[0] : medical.profiles;
        const expiryDate = new Date(medical.medical_card_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        let status = 'current';
        if (daysUntilExpiry < 0) status = 'expired';
        else if (daysUntilExpiry <= 30) status = 'expiring';

        // Apply filters
        if (filters.status !== 'all' && filters.status !== status) return;
        if (filters.dateRange.from && expiryDate < new Date(filters.dateRange.from)) return;
        if (filters.dateRange.to && expiryDate > new Date(filters.dateRange.to)) return;

        records.push({
          document_type: 'Medical Card',
          driver_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          driver_email: profile?.email || '',
          document_id: medical.medical_card_reference,
          state: '',
          class: '',
          expiry_date: medical.medical_card_expiry_date,
          days_until_expiry: daysUntilExpiry,
          status: status,
          compliance_status: status === 'current' ? 'Compliant' : status === 'expiring' ? 'Action Required' : 'Non-Compliant'
        });
      });
    }

    // Fetch training records if training type is selected
    if (filters.documentTypes.includes('training')) {
      const { data: trainings, error: trainingError } = await supabase
        .from('driver_training_records')
        .select(`
          driver_id,
          training_type,
          last_completed,
          next_due,
          profiles!inner(first_name, last_name, email)
        `);

      if (trainingError) throw trainingError;

      trainings?.forEach(training => {
        const profile = Array.isArray(training.profiles) ? training.profiles[0] : training.profiles;
        const dueDate = training.next_due ? new Date(training.next_due) : null;
        const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
        
        let status = 'current';
        if (dueDate) {
          if (daysUntilDue! < 0) status = 'expired';
          else if (daysUntilDue! <= 30) status = 'expiring';
        }

        // Apply filters
        if (filters.status !== 'all' && filters.status !== status) return;
        if (dueDate && filters.dateRange.from && dueDate < new Date(filters.dateRange.from)) return;
        if (dueDate && filters.dateRange.to && dueDate > new Date(filters.dateRange.to)) return;

        records.push({
          document_type: 'Training Certificate',
          driver_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          driver_email: profile?.email || '',
          document_id: training.training_type,
          state: '',
          class: '',
          expiry_date: training.next_due || 'No due date',
          days_until_expiry: daysUntilDue || 'N/A',
          status: status,
          compliance_status: status === 'current' ? 'Compliant' : status === 'expiring' ? 'Action Required' : 'Non-Compliant',
          last_completed: training.last_completed || 'Not completed'
        });
      });
    }

    // Sort records by expiry date
    records.sort((a, b) => {
      const dateA = new Date(a.expiry_date === 'No due date' ? '9999-12-31' : a.expiry_date);
      const dateB = new Date(b.expiry_date === 'No due date' ? '9999-12-31' : b.expiry_date);
      return dateA.getTime() - dateB.getTime();
    });

    console.log(`Exported ${records.length} compliance records`);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `compliance_export_${timestamp}.${filters.format}`;

    return new Response(JSON.stringify({
      success: true,
      records,
      filename,
      recordCount: records.length,
      exportedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Export compliance data error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Failed to export compliance data'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);