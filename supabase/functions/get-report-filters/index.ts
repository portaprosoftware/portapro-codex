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
        // Query database for actual compliance document types
        const { data: complianceTypes } = await supabase
          .from('compliance_document_types')
          .select('name')
          .eq('is_active', true);

        const documentTypes = complianceTypes?.map(type => ({
          value: type.name.toLowerCase().replace(/\s+/g, '_'),
          label: type.name
        })) || [
          { value: 'license', label: 'Driver License' },
          { value: 'medical', label: 'Medical Card' },
          { value: 'training', label: 'Training Certificate' }
        ];

        filters = [
          {
            id: 'document_type',
            type: 'select',
            label: 'Document Type',
            options: documentTypes
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
        // Query database for actual certification types
        const { data: certTypes } = await supabase
          .from('certification_types')
          .select('name, category')
          .eq('is_mandatory', true);

        const trainingTypes = certTypes?.map(cert => ({
          value: cert.name.toLowerCase().replace(/\s+/g, '_'),
          label: cert.name
        })) || [
          { value: 'safety', label: 'Safety Training' },
          { value: 'defensive_driving', label: 'Defensive Driving' }
        ];

        filters = [
          {
            id: 'training_type',
            type: 'select',
            label: 'Training Type',
            options: trainingTypes
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
          }
        ];
        break;

      case 'equipment':
        // Query database for actual vehicle and equipment types
        const { data: vehicleTypes } = await supabase
          .from('vehicles')
          .select('vehicle_type')
          .not('vehicle_type', 'is', null);

        const { data: productTypes } = await supabase
          .from('products')
          .select('name, category')
          .eq('is_active', true);

        const uniqueVehicleTypes = [...new Set(
          vehicleTypes?.map(v => v.vehicle_type).filter(Boolean) || []
        )].map(type => ({
          value: type.toLowerCase().replace(/\s+/g, '_'),
          label: type
        }));

        const uniqueProductTypes = [...new Set(
          productTypes?.map(p => p.name).filter(Boolean) || []
        )].map(type => ({
          value: type.toLowerCase().replace(/\s+/g, '_'),
          label: type
        }));

        filters = [
          {
            id: 'vehicle_type',
            type: 'select',
            label: 'Vehicle Type',
            options: uniqueVehicleTypes.length > 0 ? uniqueVehicleTypes : [
              { value: 'service_truck', label: 'Service Truck' },
              { value: 'delivery_truck', label: 'Delivery Truck' }
            ]
          },
          {
            id: 'equipment_type',
            type: 'select',
            label: 'Equipment Type',
            options: uniqueProductTypes.length > 0 ? uniqueProductTypes : [
              { value: 'portable_toilet', label: 'Portable Toilet' },
              { value: 'sink', label: 'Hand Wash Station' }
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
              { value: 'maintenance', label: 'In Maintenance' }
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
          }
        ];
        break;

      case 'incidents':
        // Based on actual spill_incidents and spill_incident_reports tables
        filters = [
          {
            id: 'incident_type',
            type: 'select',
            label: 'Incident Type',
            options: [
              { value: 'spill', label: 'Spill Incident' },
              { value: 'equipment_damage', label: 'Equipment Damage' },
              { value: 'vehicle_incident', label: 'Vehicle Incident' }
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
            id: 'cleanup_status',
            type: 'select',
            label: 'Cleanup Status',
            options: [
              { value: 'completed', label: 'Cleanup Completed' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'pending', label: 'Pending' }
            ]
          }
        ];
        break;

      case 'maintenance':
        // Query database for actual maintenance data sources
        const { data: maintenanceVehicles } = await supabase
          .from('vehicles')
          .select('vehicle_type')
          .not('vehicle_type', 'is', null);

        const maintenanceVehicleTypes = [...new Set(
          maintenanceVehicles?.map(v => v.vehicle_type).filter(Boolean) || []
        )].map(type => ({
          value: type.toLowerCase().replace(/\s+/g, '_'),
          label: type
        }));

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
            options: maintenanceVehicleTypes.length > 0 ? maintenanceVehicleTypes : [
              { value: 'service_truck', label: 'Service Truck' },
              { value: 'delivery_truck', label: 'Delivery Truck' }
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