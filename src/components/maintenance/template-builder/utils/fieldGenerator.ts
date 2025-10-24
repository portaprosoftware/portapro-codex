import { FieldConfig, SectionBlockType } from '../types';

// Field generators for each industry block type and their features
export const generateFieldsForBlock = (
  blockType: SectionBlockType,
  selectedFeatures?: string[]
): FieldConfig[] => {
  const fieldGenerators: Record<string, Record<string, () => FieldConfig[]>> = {
    per_unit_loop: {
      'QR Scan': () => [
        { id: 'unit_qr', type: 'qr_scanner', label: 'Scan Unit QR Code', required: true, auto: true },
      ],
      'Status Quick-Tap': () => [
        { id: 'unit_status', type: 'quick_tap', label: 'Unit Status', required: true, options: ['Good', 'Needs Service', 'Damaged', 'Missing'] },
      ],
      'Restock Tracking': () => [
        { id: 'supplies_added', type: 'multi_select', label: 'Supplies Added', options: ['TP', 'Sanitizer', 'Deodorant', 'Paper Towels'] },
        { id: 'supply_quantity', type: 'number', label: 'Quantity', placeholder: 'Enter amount' },
      ],
      'Auto Photos': () => [
        { id: 'unit_photos', type: 'photo_capture', label: 'Unit Photos', required: true, auto: true },
      ],
      'GPS Lock': () => [
        { id: 'gps_location', type: 'gps', label: 'GPS Location', required: true, auto: true },
      ],
    },
    delivery_setup: {
      'Site Contact': () => [
        { id: 'contact_name', type: 'text', label: 'Contact Name', required: true },
        { id: 'contact_phone', type: 'phone', label: 'Contact Phone', required: true },
      ],
      'GPS Pin': () => [
        { id: 'delivery_gps', type: 'gps', label: 'Delivery Location', required: true, auto: true },
      ],
      'Unit Types': () => [
        { id: 'units_delivered', type: 'multi_select', label: 'Units Delivered', options: ['Standard', 'ADA', 'VIP', 'Sink', 'Urinal'], required: true },
        { id: 'unit_count', type: 'number', label: 'Count', required: true },
      ],
      'Setup Checklist': () => [
        { id: 'setup_tasks', type: 'checklist', label: 'Setup Complete', options: ['Units leveled', 'Anchored', 'Stocked', 'Site cleaned'], required: true },
      ],
      'Customer Signature': () => [
        { id: 'customer_signature', type: 'signature', label: 'Customer Signature', required: true },
        { id: 'signature_timestamp', type: 'timestamp', label: 'Signed At', auto: true },
      ],
    },
    pickup_removal: {
      'Count Tracking': () => [
        { id: 'units_retrieved', type: 'number', label: 'Units Retrieved', required: true },
        { id: 'expected_count', type: 'number', label: 'Expected Count', required: true },
      ],
      'Exceptions': () => [
        { id: 'missing_units', type: 'number', label: 'Missing Units', placeholder: '0' },
        { id: 'damaged_units', type: 'number', label: 'Damaged Units', placeholder: '0' },
        { id: 'exception_notes', type: 'text_area', label: 'Exception Notes', rows: 3 },
      ],
      'Site Cleanup': () => [
        { id: 'site_clean', type: 'checklist', label: 'Cleanup Checklist', options: ['Debris removed', 'Area swept', 'No damage'], required: true },
      ],
      'Fee Tracking': () => [
        { id: 'additional_fees', type: 'multi_select', label: 'Additional Fees', options: ['Missing Unit', 'Damage', 'Extra Labor', 'Disposal'] },
        { id: 'fee_amount', type: 'number', label: 'Fee Amount', placeholder: '$0.00' },
      ],
    },
    event_service: {
      'Event Details': () => [
        { id: 'event_name', type: 'text', label: 'Event Name', required: true },
        { id: 'event_date', type: 'date', label: 'Event Date', required: true },
      ],
      'Layout Zones': () => [
        { id: 'zones', type: 'multi_select', label: 'Service Zones', options: ['Main', 'VIP', 'Backstage', 'Parking'], required: true },
      ],
      'Count Reconciliation': () => [
        { id: 'units_deployed', type: 'number', label: 'Units Deployed', required: true },
        { id: 'units_serviced', type: 'number', label: 'Units Serviced', required: true },
      ],
      'Service Frequency': () => [
        { id: 'service_times', type: 'text_area', label: 'Service Times', rows: 2, placeholder: 'E.g., 8am, 12pm, 4pm' },
      ],
    },
    repair_damage: {
      'Issue Codes': () => [
        { id: 'issue_type', type: 'dropdown', label: 'Issue Type', options: ['Door', 'Lock', 'Vent', 'Tank', 'Seat', 'Other'], required: true },
      ],
      'Parts Tracking': () => [
        { id: 'parts_used', type: 'parts_selector', label: 'Parts Used' },
        { id: 'parts_cost', type: 'number', label: 'Parts Cost', placeholder: '$0.00' },
      ],
      'Labor Time': () => [
        { id: 'labor_hours', type: 'number', label: 'Labor Hours', placeholder: '0.0', required: true },
      ],
      'Before/After Photos': () => [
        { id: 'before_photos', type: 'photo_capture', label: 'Before Photos', required: true },
        { id: 'after_photos', type: 'photo_capture', label: 'After Photos', required: true },
      ],
    },
    compliance_safety: {
      'ADA Compliance': () => [
        { id: 'ada_checklist', type: 'checklist', label: 'ADA Requirements', options: ['Accessible path', 'Proper signage', 'Clearance', 'Handrails'], required: true },
      ],
      'Hazard ID': () => [
        { id: 'hazards', type: 'multi_select', label: 'Hazards Identified', options: ['Uneven ground', 'Poor lighting', 'Trip hazard', 'Blocked access'] },
      ],
      'Site Photos': () => [
        { id: 'compliance_photos', type: 'photo_capture', label: 'Site Photos', required: true },
      ],
      'Recommendations': () => [
        { id: 'recommendations', type: 'text_area', label: 'Recommendations', rows: 4, placeholder: 'Safety improvements or corrections needed' },
      ],
    },
    customer_signoff: {
      'Name & Role': () => [
        { id: 'signee_name', type: 'text', label: 'Name', required: true },
        { id: 'signee_role', type: 'text', label: 'Role/Title', required: true },
      ],
      'Signature Pad': () => [
        { id: 'signature', type: 'signature', label: 'Signature', required: true },
      ],
      'Auto Timestamp': () => [
        { id: 'signed_at', type: 'timestamp', label: 'Signed At', auto: true, required: true },
      ],
      'GPS Lock': () => [
        { id: 'signature_gps', type: 'gps', label: 'GPS Location', auto: true, required: true },
      ],
    },
  };

  // Generic blocks have simple field generation
  const genericFieldGenerators: Record<SectionBlockType, () => FieldConfig[]> = {
    text_input: () => [{ id: 'text_field', type: 'text', label: 'Text Input', required: false }],
    text_area: () => [{ id: 'text_area_field', type: 'text_area', label: 'Text Area', rows: 4 }],
    date_time: () => [{ id: 'datetime_field', type: 'datetime', label: 'Date & Time', required: false }],
    number: () => [{ id: 'number_field', type: 'number', label: 'Number', placeholder: '0' }],
    dropdown: () => [{ id: 'dropdown_field', type: 'dropdown', label: 'Dropdown', options: ['Option 1', 'Option 2', 'Option 3'] }],
    multi_select: () => [{ id: 'multiselect_field', type: 'multi_select', label: 'Multi Select', options: ['Option 1', 'Option 2', 'Option 3'] }],
    checklist: () => [{ id: 'checklist_field', type: 'checklist', label: 'Checklist', options: ['Item 1', 'Item 2', 'Item 3'] }],
    photo: () => [{ id: 'photo_field', type: 'photo_capture', label: 'Photos', required: false }],
    signature: () => [{ id: 'signature_field', type: 'signature', label: 'Signature', required: false }],
    file_upload: () => [{ id: 'file_field', type: 'file_upload', label: 'File Upload', required: false }],
    parts_used: () => [{ id: 'parts_field', type: 'parts_selector', label: 'Parts Used' }],
    // Placeholder entries for industry blocks
    per_unit_loop: () => [],
    delivery_setup: () => [],
    pickup_removal: () => [],
    event_service: () => [],
    repair_damage: () => [],
    compliance_safety: () => [],
    customer_signoff: () => [],
  };

  // If it's a generic block, use simple generator
  if (genericFieldGenerators[blockType] && !fieldGenerators[blockType]) {
    return genericFieldGenerators[blockType]();
  }

  // For industry blocks, generate based on selected features
  const blockGenerators = fieldGenerators[blockType];
  if (!blockGenerators) return [];

  // If no features selected, return all fields
  if (!selectedFeatures || selectedFeatures.length === 0) {
    return Object.values(blockGenerators).flatMap(generator => generator());
  }

  // Generate fields only for selected features
  const fields: FieldConfig[] = [];
  selectedFeatures.forEach(feature => {
    const generator = blockGenerators[feature];
    if (generator) {
      fields.push(...generator());
    }
  });

  return fields;
};
