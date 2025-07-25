import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type CustomerType = Database["public"]["Enums"]["customer_type"];

export interface CustomerCSVRow {
  // Basic customer info
  name: string;
  customer_type?: CustomerType;
  phone?: string;
  email?: string;
  notes?: string;
  
  // Billing address
  billing_street?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  
  // Service address (for backward compatibility)
  service_street?: string;
  service_street2?: string;
  service_city?: string;
  service_state?: string;
  service_zip?: string;
  
  // Service locations (up to 3 for template)
  service_location_1_name?: string;
  service_location_1_description?: string;
  service_location_1_street?: string;
  service_location_1_street2?: string;
  service_location_1_city?: string;
  service_location_1_state?: string;
  service_location_1_zip?: string;
  service_location_1_is_default?: string;
  service_location_1_gps_lat?: string;
  service_location_1_gps_lng?: string;
  
  service_location_2_name?: string;
  service_location_2_description?: string;
  service_location_2_street?: string;
  service_location_2_street2?: string;
  service_location_2_city?: string;
  service_location_2_state?: string;
  service_location_2_zip?: string;
  service_location_2_is_default?: string;
  service_location_2_gps_lat?: string;
  service_location_2_gps_lng?: string;
  
  service_location_3_name?: string;
  service_location_3_description?: string;
  service_location_3_street?: string;
  service_location_3_street2?: string;
  service_location_3_city?: string;
  service_location_3_state?: string;
  service_location_3_zip?: string;
  service_location_3_is_default?: string;
  service_location_3_gps_lat?: string;
  service_location_3_gps_lng?: string;
  
  // Contacts (up to 2 for template)
  contact_1_type?: string;
  contact_1_first_name?: string;
  contact_1_last_name?: string;
  contact_1_email?: string;
  contact_1_phone?: string;
  contact_1_title?: string;
  contact_1_is_primary?: string;
  contact_1_notes?: string;
  
  contact_2_type?: string;
  contact_2_first_name?: string;
  contact_2_last_name?: string;
  contact_2_email?: string;
  contact_2_phone?: string;
  contact_2_title?: string;
  contact_2_is_primary?: string;
  contact_2_notes?: string;
}

const CUSTOMER_TYPES: CustomerType[] = [
  "commercial",
  "events_festivals", 
  "sports_recreation",
  "municipal_government",
  "private_events_weddings",
  "construction",
  "emergency_disaster_relief",
  "not_selected"
];

const CONTACT_TYPES = [
  "primary",
  "billing",
  "site_manager",
  "admin",
  "emergency",
  "other"
];

export const generateCustomerCSVTemplate = (): string => {
  const headers: (keyof CustomerCSVRow)[] = [
    // Basic info
    'name',
    'customer_type', 
    'phone',
    'email',
    'notes',
    
    // Billing address
    'billing_street',
    'billing_street2', 
    'billing_city',
    'billing_state',
    'billing_zip',
    
    // Legacy service address
    'service_street',
    'service_street2',
    'service_city', 
    'service_state',
    'service_zip',
    
    // Service locations
    'service_location_1_name',
    'service_location_1_description',
    'service_location_1_street',
    'service_location_1_street2',
    'service_location_1_city',
    'service_location_1_state', 
    'service_location_1_zip',
    'service_location_1_is_default',
    'service_location_1_gps_lat',
    'service_location_1_gps_lng',
    
    'service_location_2_name',
    'service_location_2_description',
    'service_location_2_street',
    'service_location_2_street2',
    'service_location_2_city',
    'service_location_2_state',
    'service_location_2_zip',
    'service_location_2_is_default',
    'service_location_2_gps_lat',
    'service_location_2_gps_lng',
    
    'service_location_3_name',
    'service_location_3_description',
    'service_location_3_street',
    'service_location_3_street2',
    'service_location_3_city',
    'service_location_3_state',
    'service_location_3_zip',
    'service_location_3_is_default',
    'service_location_3_gps_lat',
    'service_location_3_gps_lng',
    
    // Contacts
    'contact_1_type',
    'contact_1_first_name',
    'contact_1_last_name',
    'contact_1_email',
    'contact_1_phone',
    'contact_1_title',
    'contact_1_is_primary',
    'contact_1_notes',
    
    'contact_2_type',
    'contact_2_first_name',
    'contact_2_last_name', 
    'contact_2_email',
    'contact_2_phone',
    'contact_2_title',
    'contact_2_is_primary',
    'contact_2_notes'
  ];

  // Create example rows with instructions
  const exampleRows: CustomerCSVRow[] = [
    {
      name: "ABC Construction Inc",
      customer_type: "construction",
      phone: "(555) 123-4567",
      email: "contact@abcconstruction.com",
      notes: "Large construction company, prefers morning deliveries",
      
      billing_street: "123 Business Ave",
      billing_street2: "Suite 100",
      billing_city: "Business City", 
      billing_state: "NY",
      billing_zip: "12345",
      
      service_street: "456 Construction Site Rd",
      service_city: "Work City",
      service_state: "NY", 
      service_zip: "12346",
      
      service_location_1_name: "Main Office",
      service_location_1_description: "Primary business location",
      service_location_1_street: "123 Business Ave",
      service_location_1_city: "Business City",
      service_location_1_state: "NY",
      service_location_1_zip: "12345",
      service_location_1_is_default: "true",
      service_location_1_gps_lat: "40.7128",
      service_location_1_gps_lng: "-74.0060",
      
      service_location_2_name: "Construction Site A",
      service_location_2_description: "Active construction project",
      service_location_2_street: "456 Construction Site Rd", 
      service_location_2_city: "Work City",
      service_location_2_state: "NY",
      service_location_2_zip: "12346",
      service_location_2_is_default: "false",
      service_location_2_gps_lat: "40.7589",
      service_location_2_gps_lng: "-73.9851",
      
      contact_1_type: "primary",
      contact_1_first_name: "John",
      contact_1_last_name: "Doe", 
      contact_1_email: "john.doe@abcconstruction.com",
      contact_1_phone: "(555) 123-4567",
      contact_1_title: "Project Manager",
      contact_1_is_primary: "true",
      contact_1_notes: "Main point of contact for all projects",
      
      contact_2_type: "billing",
      contact_2_first_name: "Jane",
      contact_2_last_name: "Smith",
      contact_2_email: "jane.smith@abcconstruction.com", 
      contact_2_phone: "(555) 123-4568",
      contact_2_title: "Accounting Manager",
      contact_2_is_primary: "false",
      contact_2_notes: "Handles all invoicing and payments"
    }
  ];

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    `# INSTRUCTIONS: Delete this comment row before uploading`,
    `# Customer Types: ${CUSTOMER_TYPES.join(', ')}`,
    `# Contact Types: ${CONTACT_TYPES.join(', ')}`, 
    `# GPS Format: Use decimal degrees (e.g. 40.7128, -74.0060)`,
    `# Boolean Fields: Use "true" or "false" for is_default and is_primary`,
    `# You can add multiple service locations (up to 10) and contacts (up to 5)`,
    `# Required fields: name, customer_type, phone or email`,
    ...exampleRows.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
};

export const downloadCSVTemplate = () => {
  const csvContent = generateCustomerCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'customer_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parseCSVFile = (file: File): Promise<CustomerCSVRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header row and one data row'));
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows: CustomerCSVRow[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Validate required fields
          if (!row.name || (!row.phone && !row.email)) {
            continue; // Skip invalid rows
          }
          
          rows.push(row as CustomerCSVRow);
        }
        
        resolve(rows);
      } catch (error) {
        reject(new Error('Failed to parse CSV file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const importCustomersFromCSV = async (customers: CustomerCSVRow[]): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = { success: 0, failed: 0, errors: [] as string[] };
  
  for (const customerData of customers) {
    try {
      // Insert customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerData.name,
          customer_type: customerData.customer_type || null,
          phone: customerData.phone || null,
          email: customerData.email || null,
          notes: customerData.notes || null,
          billing_street: customerData.billing_street || null,
          billing_street2: customerData.billing_street2 || null,
          billing_city: customerData.billing_city || null,
          billing_state: customerData.billing_state || null,
          billing_zip: customerData.billing_zip || null,
          service_street: customerData.service_street || null,
          service_street2: customerData.service_street2 || null,
          service_city: customerData.service_city || null,
          service_state: customerData.service_state || null,
          service_zip: customerData.service_zip || null
        })
        .select()
        .single();
        
      if (customerError) {
        results.failed++;
        results.errors.push(`Customer "${customerData.name}": ${customerError.message}`);
        continue;
      }
      
      // Insert service locations
      for (let i = 1; i <= 10; i++) {
        const locationName = customerData[`service_location_${i}_name` as keyof CustomerCSVRow];
        if (!locationName) continue;
        
        const { data: location, error: locationError } = await supabase
          .from('customer_service_locations')
          .insert({
            customer_id: customer.id,
            location_name: locationName,
            location_description: customerData[`service_location_${i}_description` as keyof CustomerCSVRow] || null,
            street: customerData[`service_location_${i}_street` as keyof CustomerCSVRow] || null,
            street2: customerData[`service_location_${i}_street2` as keyof CustomerCSVRow] || null,
            city: customerData[`service_location_${i}_city` as keyof CustomerCSVRow] || null,
            state: customerData[`service_location_${i}_state` as keyof CustomerCSVRow] || null,
            zip: customerData[`service_location_${i}_zip` as keyof CustomerCSVRow] || null,
            is_default: customerData[`service_location_${i}_is_default` as keyof CustomerCSVRow] === 'true',
            is_active: true
          })
          .select()
          .single();
          
        if (locationError) {
          results.errors.push(`Service location "${locationName}" for customer "${customerData.name}": ${locationError.message}`);
          continue;
        }
        
        // Insert GPS coordinates if provided
        const lat = customerData[`service_location_${i}_gps_lat` as keyof CustomerCSVRow];
        const lng = customerData[`service_location_${i}_gps_lng` as keyof CustomerCSVRow];
        
        if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
          const { error: coordError } = await supabase
            .from('service_location_coordinates')
            .insert({
              service_location_id: location.id,
              point_name: `${locationName} - Main`,
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              is_primary: true,
              category: 'main'
            });
            
          if (coordError) {
            results.errors.push(`GPS coordinates for "${locationName}": ${coordError.message}`);
          }
        }
      }
      
      // Insert contacts
      for (let i = 1; i <= 5; i++) {
        const firstName = customerData[`contact_${i}_first_name` as keyof CustomerCSVRow];
        const lastName = customerData[`contact_${i}_last_name` as keyof CustomerCSVRow];
        
        if (!firstName || !lastName) continue;
        
        const { error: contactError } = await supabase
          .from('customer_contacts')
          .insert({
            customer_id: customer.id,
            contact_type: customerData[`contact_${i}_type` as keyof CustomerCSVRow] || 'other',
            first_name: firstName,
            last_name: lastName,
            email: customerData[`contact_${i}_email` as keyof CustomerCSVRow] || null,
            phone: customerData[`contact_${i}_phone` as keyof CustomerCSVRow] || null,
            title: customerData[`contact_${i}_title` as keyof CustomerCSVRow] || null,
            is_primary: customerData[`contact_${i}_is_primary` as keyof CustomerCSVRow] === 'true',
            notes: customerData[`contact_${i}_notes` as keyof CustomerCSVRow] || null
          });
          
        if (contactError) {
          results.errors.push(`Contact "${firstName} ${lastName}" for customer "${customerData.name}": ${contactError.message}`);
        }
      }
      
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Customer "${customerData.name}": ${(error as Error).message}`);
    }
  }
  
  return results;
};