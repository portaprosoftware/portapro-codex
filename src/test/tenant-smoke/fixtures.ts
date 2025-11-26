import { SupabaseClient } from '@supabase/supabase-js';
import { tenantTable } from '@/lib/db/tenant';
import { Database } from '@/integrations/supabase/types';

export type TenantFixtures = {
  orgId: string;
  customerId: string;
  invoiceId: string;
  jobId: string;
  jobItemId: string;
  paymentId: string;
  vehicleId: string;
  maintenanceRecordId: string;
  productId: string;
  productItemId: string;
};

export async function createOrgWithData(
  supabase: SupabaseClient<Database>,
  orgId: string
): Promise<TenantFixtures> {
  const customerPayload = {
    name: `Tenant ${orgId} Customer`,
    email: `customer-${orgId}@example.com`,
    billing_differs_from_service: false,
  };

  const { data: customer, error: customerError } = await tenantTable(
    supabase,
    orgId,
    'customers'
  )
    .insert(customerPayload)
    .select()
    .single();

  if (customerError || !customer) throw customerError ?? new Error('Failed to create customer');

  const vehiclePayload = {
    license_plate: `TENANT-${orgId.slice(-4)}`,
    make: 'PortaPro',
    model: 'Ranger',
    status: 'active',
    year: 2024,
  };

  const { data: vehicle, error: vehicleError } = await tenantTable(
    supabase,
    orgId,
    'vehicles'
  )
    .insert(vehiclePayload)
    .select()
    .single();

  if (vehicleError || !vehicle) throw vehicleError ?? new Error('Failed to create vehicle');

  const productPayload = {
    name: `Portable Unit ${orgId.slice(-4)}`,
    default_price_per_day: 25,
    stock_total: 10,
    stock_in_service: 0,
    track_inventory: true,
    low_stock_threshold: 1,
    is_active: true,
  };

  const { data: product, error: productError } = await tenantTable(
    supabase,
    orgId,
    'products'
  )
    .insert(productPayload)
    .select()
    .single();

  if (productError || !product) throw productError ?? new Error('Failed to create product');

  const productItemPayload = {
    product_id: product.id,
    item_code: `UNIT-${orgId.slice(-4)}-001`,
    status: 'available',
  };

  const { data: productItem, error: productItemError } = await tenantTable(
    supabase,
    orgId,
    'product_items'
  )
    .insert(productItemPayload)
    .select()
    .single();

  if (productItemError || !productItem)
    throw productItemError ?? new Error('Failed to create product item');

  const scheduledDate = new Date().toISOString();

  const jobPayload = {
    customer_id: customer.id,
    job_type: 'rental',
    job_number: `JOB-${orgId.slice(-4)}`,
    scheduled_date: scheduledDate,
    status: 'scheduled',
    total_price: 125,
  };

  const { data: job, error: jobError } = await tenantTable(supabase, orgId, 'jobs')
    .insert(jobPayload)
    .select()
    .single();

  if (jobError || !job) throw jobError ?? new Error('Failed to create job');

  const jobItemPayload = {
    job_id: job.id,
    product_id: product.id,
    quantity: 1,
    total_price: 125,
    unit_price: 125,
  };

  const { data: jobItem, error: jobItemError } = await tenantTable(
    supabase,
    orgId,
    'job_items'
  )
    .insert(jobItemPayload)
    .select()
    .single();

  if (jobItemError || !jobItem) throw jobItemError ?? new Error('Failed to create job item');

  const invoicePayload = {
    amount: 125,
    customer_id: customer.id,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    job_id: job.id,
  };

  const { data: invoice, error: invoiceError } = await tenantTable(
    supabase,
    orgId,
    'invoices'
  )
    .insert(invoicePayload)
    .select()
    .single();

  if (invoiceError || !invoice) throw invoiceError ?? new Error('Failed to create invoice');

  const paymentPayload = {
    amount: 125,
    invoice_id: invoice.id,
    currency: 'usd',
    payment_method: 'card',
    status: 'succeeded',
    metadata: {},
  };

  const { data: payment, error: paymentError } = await tenantTable(
    supabase,
    orgId,
    'payments'
  )
    .insert(paymentPayload)
    .select()
    .single();

  if (paymentError || !payment) throw paymentError ?? new Error('Failed to create payment');

  const maintenancePayload = {
    vehicle_id: vehicle.id,
    description: 'Routine check',
    maintenance_type: 'inspection',
    status: 'scheduled',
    scheduled_date: scheduledDate,
  };

  const { data: maintenance, error: maintenanceError } = await tenantTable(
    supabase,
    orgId,
    'maintenance_records'
  )
    .insert(maintenancePayload)
    .select()
    .single();

  if (maintenanceError || !maintenance)
    throw maintenanceError ?? new Error('Failed to create maintenance record');

  return {
    orgId,
    customerId: customer.id,
    invoiceId: invoice.id,
    jobId: job.id,
    jobItemId: jobItem.id,
    paymentId: payment.id,
    vehicleId: vehicle.id,
    maintenanceRecordId: maintenance.id,
    productId: product.id,
    productItemId: productItem.id,
  };
}
