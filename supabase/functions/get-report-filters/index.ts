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
    const { dataSource } = await req.json();
    console.log('Getting report filters for data source:', dataSource);

    let filters: any[] = [];

    switch (dataSource) {
      case 'drivers':
        // Query database for actual options
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('home_base')
          .not('home_base', 'is', null);
        
        const { data: licenseData } = await supabase
          .from('driver_credentials')
          .select('license_class, cdl_class')
          .not('license_class', 'is', null);

        // Get unique locations
        const locations = [...new Set(
          profilesData?.map(p => p.home_base).filter(Boolean) || []
        )].map(location => ({
          value: location.toLowerCase().replace(/\s+/g, '_'),
          label: location
        }));

        // Get unique license types
        const licenseTypes = [...new Set([
          ...(licenseData?.map(l => l.license_class).filter(Boolean) || []),
          ...(licenseData?.map(l => l.cdl_class).filter(Boolean) || [])
        ])].map(license => ({
          value: license,
          label: license === 'CDL-A' ? 'CDL Class A' :
                 license === 'CDL-B' ? 'CDL Class B' :
                 license === 'CDL-C' ? 'CDL Class C' :
                 license
        }));

        filters = [
          {
            id: 'status',
            type: 'select',
            label: 'Driver Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]
          },
          {
            id: 'license_class',
            type: 'multiselect',
            label: 'License Type/Class',
            options: licenseTypes.length > 0 ? licenseTypes : [
              { value: 'CDL-A', label: 'CDL Class A' },
              { value: 'CDL-B', label: 'CDL Class B' },
              { value: 'CDL-C', label: 'CDL Class C' },
              { value: 'regular', label: 'Regular License' }
            ]
          },
          {
            id: 'training_status',
            type: 'select',
            label: 'Training Status',
            options: [
              { value: 'completed', label: 'Completed' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'not_started', label: 'Not Started' }
            ]
          },
          {
            id: 'hire_date_range',
            type: 'date',
            label: 'Hire Date Range'
          },
          {
            id: 'location_region',
            type: 'select',
            label: 'Location/Region',
            options: locations.length > 0 ? locations : [
              { value: 'main_office', label: 'Main Office' },
              { value: 'warehouse', label: 'Warehouse' },
              { value: 'field', label: 'Field Operations' }
            ]
          },
          {
            id: 'certification_status',
            type: 'select',
            label: 'Certification Status',
            options: [
              { value: 'current', label: 'All Current' },
              { value: 'expiring_soon', label: 'Expiring Soon' },
              { value: 'expired', label: 'Has Expired Certs' },
              { value: 'missing', label: 'Missing Required Certs' }
            ]
          }
        ];
        break;

      case 'compliance':
        filters = [
          {
            id: 'document_type',
            type: 'select',
            label: 'Document Type',
            options: [
              { value: 'license', label: 'Driver License' },
              { value: 'medical', label: 'Medical Card' },
              { value: 'training', label: 'Training Certificate' },
              { value: 'insurance', label: 'Insurance Documents' },
              { value: 'vehicle_registration', label: 'Vehicle Registration' }
            ]
          },
          {
            id: 'expiry_status',
            type: 'select',
            label: 'Document Expiration Status',
            options: [
              { value: 'current', label: 'Current' },
              { value: 'expiring', label: 'Expiring Soon' },
              { value: 'expired', label: 'Expired' },
              { value: 'missing', label: 'Missing' }
            ]
          },
          {
            id: 'compliance_score_range',
            type: 'select',
            label: 'Compliance Score Range',
            options: [
              { value: '90-100', label: '90-100% (Excellent)' },
              { value: '80-90', label: '80-90% (Good)' },
              { value: '70-80', label: '70-80% (Fair)' },
              { value: '0-70', label: 'Below 70% (Poor)' }
            ]
          },
          {
            id: 'audit_results',
            type: 'select',
            label: 'Audit Results',
            options: [
              { value: 'passed', label: 'Passed' },
              { value: 'failed', label: 'Failed' },
              { value: 'pending', label: 'Pending Review' },
              { value: 'not_audited', label: 'Not Audited' }
            ]
          },
          {
            id: 'training_completion_status',
            type: 'select',
            label: 'Training Completion Status',
            options: [
              { value: 'completed', label: 'All Required Training Complete' },
              { value: 'in_progress', label: 'Training In Progress' },
              { value: 'overdue', label: 'Overdue Training' },
              { value: 'not_started', label: 'Not Started' }
            ]
          },
          {
            id: 'days_until_expiry',
            type: 'select',
            label: 'Days Until Expiry',
            options: [
              { value: '7', label: 'Within 7 days' },
              { value: '30', label: 'Within 30 days' },
              { value: '60', label: 'Within 60 days' },
              { value: '90', label: 'Within 90 days' }
            ]
          }
        ];
        break;

      case 'training':
        filters = [
          {
            id: 'training_type',
            type: 'select',
            label: 'Training Type',
            options: [
              { value: 'safety', label: 'Safety Training' },
              { value: 'defensive_driving', label: 'Defensive Driving' },
              { value: 'hazmat', label: 'Hazmat Certification' },
              { value: 'equipment', label: 'Equipment Training' }
            ]
          },
          {
            id: 'completion_status',
            type: 'select',
            label: 'Completion Status',
            options: [
              { value: 'completed', label: 'Completed' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'not_started', label: 'Not Started' }
            ]
          },
          {
            id: 'instructor',
            type: 'select',
            label: 'Instructor',
            options: [
              { value: 'internal', label: 'Internal Staff' },
              { value: 'external', label: 'External Provider' }
            ]
          }
        ];
        break;

      case 'equipment':
        filters = [
          {
            id: 'vehicle_type',
            type: 'select',
            label: 'Vehicle Type',
            options: [
              { value: 'service_truck', label: 'Service Truck' },
              { value: 'pumper_truck', label: 'Pumper Truck' },
              { value: 'delivery_truck', label: 'Delivery Truck' },
              { value: 'van', label: 'Van' },
              { value: 'trailer', label: 'Trailer' }
            ]
          },
          {
            id: 'equipment_type',
            type: 'select',
            label: 'Equipment Type',
            options: [
              { value: 'portable_toilet', label: 'Portable Toilet' },
              { value: 'sink', label: 'Hand Wash Station' },
              { value: 'trailer', label: 'Trailer' },
              { value: 'pump', label: 'Pump' },
              { value: 'generator', label: 'Generator' }
            ]
          },
          {
            id: 'assignment_status',
            type: 'select',
            label: 'Assignment Status',
            options: [
              { value: 'assigned', label: 'Assigned' },
              { value: 'available', label: 'Available' },
              { value: 'out_of_service', label: 'Out of Service' },
              { value: 'maintenance', label: 'In Maintenance' },
              { value: 'retired', label: 'Retired' }
            ]
          },
          {
            id: 'maintenance_status',
            type: 'select',
            label: 'Maintenance Status',
            options: [
              { value: 'up_to_date', label: 'Up to Date' },
              { value: 'due_soon', label: 'Due Soon' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'in_progress', label: 'In Progress' }
            ]
          },
          {
            id: 'location_based',
            type: 'boolean',
            label: 'Include Location Data'
          }
        ];
        break;

      case 'incidents':
        filters = [
          {
            id: 'incident_type',
            type: 'select',
            label: 'Incident Type',
            options: [
              { value: 'accident', label: 'Vehicle Accident' },
              { value: 'injury', label: 'Workplace Injury' },
              { value: 'damage', label: 'Equipment Damage' },
              { value: 'complaint', label: 'Customer Complaint' }
            ]
          },
          {
            id: 'severity',
            type: 'select',
            label: 'Severity Level',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' }
            ]
          },
          {
            id: 'resolved',
            type: 'boolean',
            label: 'Include Only Resolved'
          }
        ];
        break;

      case 'maintenance':
        filters = [
          {
            id: 'maintenance_type',
            type: 'select',
            label: 'Maintenance Type',
            options: [
              { value: 'preventive', label: 'Preventive' },
              { value: 'corrective', label: 'Corrective' },
              { value: 'emergency', label: 'Emergency' },
              { value: 'inspection', label: 'Inspection' }
            ]
          },
          {
            id: 'vehicle_type',
            type: 'select',
            label: 'Vehicle Type',
            options: [
              { value: 'truck', label: 'Service Truck' },
              { value: 'van', label: 'Van' },
              { value: 'trailer', label: 'Trailer' },
              { value: 'equipment', label: 'Equipment' }
            ]
          },
          {
            id: 'cost_range',
            type: 'select',
            label: 'Cost Range',
            options: [
              { value: '0-100', label: '$0 - $100' },
              { value: '100-500', label: '$100 - $500' },
              { value: '500-1000', label: '$500 - $1,000' },
              { value: '1000+', label: '$1,000+' }
            ]
          }
        ];
        break;

      default:
        filters = [
          {
            id: 'date_range',
            type: 'date',
            label: 'Date Range'
          },
          {
            id: 'status',
            type: 'select',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]
          }
        ];
    }

    return new Response(JSON.stringify({
      success: true,
      filters,
      dataSource
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Get report filters error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Failed to get report filters'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);