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
    const { config } = await req.json();
    console.log('Generating custom report with config:', config);

    let query = supabase.from('profiles');
    let records: any[] = [];

    // Apply data source specific queries
    switch (config.dataSource) {
      case 'team_members':
        query = supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            status,
            home_base,
            hire_date,
            created_at,
            driver_credentials(license_number, license_expiry_date, medical_card_expiry_date, license_class),
            user_roles!inner(role)
          `);
        break;

      case 'compliance':
        query = supabase
          .from('driver_credentials')
          .select(`
            license_number,
            license_expiry_date,
            medical_card_expiry_date,
            license_class,
            license_state,
            profiles!inner(first_name, last_name, email, status)
          `);
        break;

      case 'training':
        query = supabase
          .from('driver_training_records')
          .select(`
            training_type,
            last_completed,
            next_due,
            instructor_name,
            profiles!inner(first_name, last_name, email)
          `);
        break;

      case 'equipment':
        query = supabase
          .from('equipment_assignments')
          .select(`
            id,
            status,
            assigned_date,
            return_date,
            quantity,
            jobs!inner(customer_id, scheduled_date),
            products(name, category),
            product_items(item_code, status)
          `);
        break;

      case 'maintenance':
        query = supabase
          .from('maintenance_reports')
          .select(`
            id,
            report_number,
            created_at,
            status,
            priority,
            cost_estimate,
            vehicles(license_plate, vehicle_type),
            profiles!inner(first_name, last_name)
          `);
        break;

      default:
        throw new Error('Unsupported data source');
    }

    // Apply date range filters
    if (config.dateRange.from && config.dateRange.to) {
      const dateField = config.dataSource === 'compliance' ? 'license_expiry_date' : 'created_at';
      query = query
        .gte(dateField, config.dateRange.from)
        .lte(dateField, config.dateRange.to);
    }

    // Apply custom filters
    config.filters.forEach((filter: any) => {
      if (!filter.value) return;

      switch (filter.type) {
        case 'select':
          if (filter.id === 'status') {
            query = query.eq('status', filter.value);
          } else if (filter.id === 'role' && config.dataSource === 'team_members') {
            query = query.eq('user_roles.role', filter.value);
          } else if (filter.id === 'license_class') {
            query = query.eq('driver_credentials.license_class', filter.value);
          } else if (filter.id === 'location_region' && config.dataSource === 'team_members') {
            query = query.eq('home_base', filter.value);
          } else if (filter.id === 'document_type' && config.dataSource === 'compliance') {
            // Special handling for compliance document type filter
            if (filter.value === 'license') {
              query = query.not('license_expiry_date', 'is', null);
            } else if (filter.value === 'medical') {
              query = query.not('medical_card_expiry_date', 'is', null);
            }
          }
          break;
        case 'boolean':
          // Handle boolean filters if needed
          break;
        case 'date':
          // Date filters already handled above
          break;
      }
    });

    const { data, error } = await query.limit(1000);

    if (error) throw error;

    // Process and transform data based on data source
    switch (config.dataSource) {
      case 'team_members':
        records = data?.map(member => ({
          member_name: `${member.first_name} ${member.last_name}`,
          email: member.email,
          phone: member.phone,
          role: member.user_roles?.[0]?.role || 'unknown',
          status: member.status,
          home_base: member.home_base || 'N/A',
          hire_date: member.hire_date || member.created_at,
          license_expires: member.driver_credentials?.[0]?.license_expiry_date || 'N/A',
          medical_expires: member.driver_credentials?.[0]?.medical_card_expiry_date || 'N/A',
          license_class: member.driver_credentials?.[0]?.license_class || 'N/A'
        })) || [];
        break;

      case 'compliance':
        records = data?.map(cred => {
          const profile = Array.isArray(cred.profiles) ? cred.profiles[0] : cred.profiles;
          const licenseExpiry = cred.license_expiry_date ? new Date(cred.license_expiry_date) : null;
          const medicalExpiry = cred.medical_card_expiry_date ? new Date(cred.medical_card_expiry_date) : null;
          const today = new Date();

          return {
            driver_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
            email: profile?.email || '',
            license_number: cred.license_number || 'N/A',
            license_class: cred.license_class || 'N/A',
            license_state: cred.license_state || 'N/A',
            license_expiry: cred.license_expiry_date || 'N/A',
            license_days_until_expiry: licenseExpiry ? Math.ceil((licenseExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A',
            medical_expiry: cred.medical_card_expiry_date || 'N/A',
            medical_days_until_expiry: medicalExpiry ? Math.ceil((medicalExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'
          };
        }) || [];
        break;

      case 'training':
        records = data?.map(training => {
          const profile = Array.isArray(training.profiles) ? training.profiles[0] : training.profiles;
          return {
            driver_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
            email: profile?.email || '',
            training_type: training.training_type,
            last_completed: training.last_completed || 'Not completed',
            next_due: training.next_due || 'Not scheduled',
            instructor: training.instructor_name || 'N/A'
          };
        }) || [];
        break;

      case 'equipment':
        records = data?.map(assignment => ({
          assignment_id: assignment.id,
          equipment_type: assignment.products?.name || 'Unknown',
          item_code: assignment.product_items?.item_code || 'Bulk assignment',
          status: assignment.status,
          assigned_date: assignment.assigned_date,
          return_date: assignment.return_date || 'Not returned',
          quantity: assignment.quantity,
          job_date: assignment.jobs?.scheduled_date || 'N/A'
        })) || [];
        break;

      case 'maintenance':
        records = data?.map(report => ({
          report_number: report.report_number,
          vehicle: report.vehicles?.license_plate || 'Unknown',
          vehicle_type: report.vehicles?.vehicle_type || 'Unknown',
          created_date: report.created_at,
          status: report.status,
          priority: report.priority,
          cost_estimate: report.cost_estimate || 0,
          technician: `${report.profiles?.first_name || ''} ${report.profiles?.last_name || ''}`.trim()
        })) || [];
        break;

      default:
        records = data || [];
    }

    console.log(`Generated ${records.length} records for ${config.dataSource} report`);

    return new Response(JSON.stringify({
      success: true,
      records,
      recordCount: records.length,
      config,
      generatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Generate custom report error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Failed to generate custom report'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);