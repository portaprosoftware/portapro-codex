-- Phase 5D — tenant-aware indexing and integrity hardening

-- Ensure common tenant filters are indexed for dashboards and list views
DO $$
BEGIN
  IF to_regclass('public.customers') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS customers_organization_id_idx ON public.customers (organization_id);
  END IF;

  IF to_regclass('public.jobs') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS jobs_organization_created_idx ON public.jobs (organization_id, created_at);
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS invoices_organization_created_idx ON public.invoices (organization_id, created_at);
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS payments_organization_created_idx ON public.payments (organization_id, created_at);
  END IF;

  IF to_regclass('public.routes') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS routes_organization_id_idx ON public.routes (organization_id);
  END IF;

  IF to_regclass('public.route_stops') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS route_stops_org_route_idx ON public.route_stops (organization_id, route_id);
  END IF;

  IF to_regclass('public.work_orders') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS work_orders_org_created_idx ON public.work_orders (organization_id, created_at);
  END IF;

  IF to_regclass('public.work_order_lines') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS work_order_lines_org_idx ON public.work_order_lines (organization_id);
  END IF;

  IF to_regclass('public.dvir_reports') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS dvir_reports_org_created_idx ON public.dvir_reports (organization_id, created_at);
  END IF;
END $$;

-- Harden NOT NULL guarantees for tenant scoping where data is already populated
DO $$
BEGIN
  IF to_regclass('public.customers') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE organization_id IS NULL) THEN
      ALTER TABLE public.customers ALTER COLUMN organization_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'Skipping NOT NULL on customers.organization_id due to existing NULL values';
    END IF;
  END IF;

  IF to_regclass('public.jobs') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.jobs WHERE organization_id IS NULL) THEN
      ALTER TABLE public.jobs ALTER COLUMN organization_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'Skipping NOT NULL on jobs.organization_id due to existing NULL values';
    END IF;
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.invoices WHERE organization_id IS NULL) THEN
      ALTER TABLE public.invoices ALTER COLUMN organization_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'Skipping NOT NULL on invoices.organization_id due to existing NULL values';
    END IF;
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.payments WHERE organization_id IS NULL) THEN
      ALTER TABLE public.payments ALTER COLUMN organization_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'Skipping NOT NULL on payments.organization_id due to existing NULL values';
    END IF;
  END IF;

  IF to_regclass('public.routes') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.routes WHERE organization_id IS NULL) THEN
      ALTER TABLE public.routes ALTER COLUMN organization_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'Skipping NOT NULL on routes.organization_id due to existing NULL values';
    END IF;
  END IF;

  IF to_regclass('public.route_stops') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.route_stops WHERE organization_id IS NULL) THEN
      ALTER TABLE public.route_stops ALTER COLUMN organization_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'Skipping NOT NULL on route_stops.organization_id due to existing NULL values';
    END IF;
  END IF;
END $$;

-- Enforce uniqueness for organization slugs used in routing while allowing NULLs
DO $$
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'organizations_org_slug_unique_idx'
    ) THEN
      CREATE UNIQUE INDEX organizations_org_slug_unique_idx ON public.organizations (org_slug) WHERE org_slug IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Add safe foreign keys for tenant relationships when tables exist
DO $$
BEGIN
  IF to_regclass('public.jobs') IS NOT NULL AND to_regclass('public.customers') IS NOT NULL THEN
    ALTER TABLE public.jobs
    ADD CONSTRAINT IF NOT EXISTS jobs_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES public.customers (id)
    ON DELETE SET NULL;
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL AND to_regclass('public.customers') IS NOT NULL THEN
    ALTER TABLE public.invoices
    ADD CONSTRAINT IF NOT EXISTS invoices_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES public.customers (id)
    ON DELETE SET NULL;
  END IF;

  IF to_regclass('public.route_stops') IS NOT NULL AND to_regclass('public.routes') IS NOT NULL THEN
    ALTER TABLE public.route_stops
    ADD CONSTRAINT IF NOT EXISTS route_stops_route_id_fkey
    FOREIGN KEY (route_id)
    REFERENCES public.routes (id)
    ON DELETE CASCADE;
  END IF;
END $$;
